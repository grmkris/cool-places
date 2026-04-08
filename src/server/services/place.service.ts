import {
  and,
  desc,
  eq,
  getTableColumns,
  ilike,
  lt,
  or,
  sql,
  type SQL,
} from "drizzle-orm"
import { ORPCError } from "@orpc/server"
import type { CoolPlaceId, UserId } from "@/lib/typeid"
import type { Database } from "../db/db"
import { coolPlace, placeVisit } from "../db/schema/place/place.db"
import { user } from "../db/schema/auth/auth.db"
import type {
  CoolPlaceResponse,
  CreatePlaceInput,
  ListPlacesInput,
  UpdatePlaceInput,
} from "../db/schema/place/place.zod"

type RawPlaceRow = typeof coolPlace.$inferSelect & {
  creatorName: string
  // Postgres count(*) returns bigint; node-postgres serializes it as string
  // by default. Cast at the boundary in toCoolPlace.
  visitCount: number | string
  lastVisitedAt: Date | null
}

function toCoolPlace(
  row: RawPlaceRow,
  callerUserId: UserId
): CoolPlaceResponse {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    description: row.description,
    coordinates: [row.longitude, row.latitude],
    locationName: row.locationName,
    sourceUrl: row.sourceUrl,
    imageUrls: row.imageUrls,
    tags: row.tags,
    isPublic: row.isPublic,
    visitCount: Number(row.visitCount),
    lastVisitedAt: row.lastVisitedAt ? row.lastVisitedAt.toISOString() : null,
    isOwner: row.userId === callerUserId,
    creatorName: row.creatorName,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function createPlaceService(props: { db: Database }) {
  const { db } = props

  // Subquery: visit stats per place, scoped to the calling user (so the
  // visit count + lastVisitedAt reflect "my visits to this place").
  function visitStatsSubquery(callerUserId: UserId) {
    return db
      .select({
        placeId: placeVisit.placeId,
        visitCount: sql<number>`count(*)`.as("visit_count"),
        lastVisitedAt:
          sql<Date | null>`max(${placeVisit.visitedAt})`.as("last_visited_at"),
      })
      .from(placeVisit)
      .where(eq(placeVisit.userId, callerUserId))
      .groupBy(placeVisit.placeId)
      .as("visit_stats")
  }

  async function list(params: {
    callerUserId: UserId
    filters?: ListPlacesInput
  }) {
    const { callerUserId, filters } = params
    const limit = filters?.limit ? Math.min(filters.limit, 500) : undefined
    const conditions: SQL[] = []

    if (filters?.includePublic) {
      const visibility = or(
        eq(coolPlace.userId, callerUserId),
        eq(coolPlace.isPublic, true)
      )
      if (visibility) conditions.push(visibility)
    } else {
      conditions.push(eq(coolPlace.userId, callerUserId))
    }

    if (filters?.search) {
      const pattern = `%${filters.search}%`
      const searchCondition = or(
        ilike(coolPlace.title, pattern),
        ilike(coolPlace.locationName, pattern)
      )
      if (searchCondition) conditions.push(searchCondition)
    }

    if (filters?.tags && filters.tags.length > 0) {
      // jsonb ?| array operator: any tag matches
      conditions.push(
        sql`${coolPlace.tags} ?| ARRAY[${sql.join(
          filters.tags.map((t) => sql`${t}`),
          sql`, `
        )}]::text[]`
      )
    }

    // Push visitedFilter into SQL so limit+1 pagination stays correct. In-memory
    // filtering after the fetch would make hasMore wrong.
    if (filters?.visitedFilter === "visited") {
      conditions.push(
        sql`EXISTS (SELECT 1 FROM ${placeVisit} WHERE ${placeVisit.placeId} = ${coolPlace.id} AND ${placeVisit.userId} = ${callerUserId})`
      )
    } else if (filters?.visitedFilter === "unvisited") {
      conditions.push(
        sql`NOT EXISTS (SELECT 1 FROM ${placeVisit} WHERE ${placeVisit.placeId} = ${coolPlace.id} AND ${placeVisit.userId} = ${callerUserId})`
      )
    }

    if (filters?.cursor) {
      const cursorRow = await db.query.coolPlace.findFirst({
        where: (p, { eq }) => eq(p.id, filters.cursor!),
        columns: { createdAt: true },
      })
      if (cursorRow) {
        conditions.push(lt(coolPlace.createdAt, cursorRow.createdAt))
      }
    }

    const visitStats = visitStatsSubquery(callerUserId)

    const baseQuery = db
      .select({
        ...getTableColumns(coolPlace),
        creatorName: user.name,
        visitCount: sql<number>`coalesce(${visitStats.visitCount}, 0)`,
        lastVisitedAt: visitStats.lastVisitedAt,
      })
      .from(coolPlace)
      .innerJoin(user, eq(coolPlace.userId, user.id))
      .leftJoin(visitStats, eq(visitStats.placeId, coolPlace.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(coolPlace.createdAt))

    const rows = limit ? await baseQuery.limit(limit + 1) : await baseQuery

    const items = rows.map((r) => toCoolPlace(r as RawPlaceRow, callerUserId))

    if (limit) {
      const hasMore = items.length > limit
      const sliced = items.slice(0, limit)
      const nextCursor = hasMore
        ? (sliced[sliced.length - 1]?.id ?? null)
        : null
      return { items: sliced, nextCursor }
    }

    return { items, nextCursor: null }
  }

  async function getById(params: {
    id: CoolPlaceId
    callerUserId: UserId
  }): Promise<CoolPlaceResponse | null> {
    const visitStats = visitStatsSubquery(params.callerUserId)

    const rows = await db
      .select({
        ...getTableColumns(coolPlace),
        creatorName: user.name,
        visitCount: sql<number>`coalesce(${visitStats.visitCount}, 0)`,
        lastVisitedAt: visitStats.lastVisitedAt,
      })
      .from(coolPlace)
      .innerJoin(user, eq(coolPlace.userId, user.id))
      .leftJoin(visitStats, eq(visitStats.placeId, coolPlace.id))
      .where(eq(coolPlace.id, params.id))
      .limit(1)

    const row = rows[0]
    if (!row) return null

    const place = toCoolPlace(row as RawPlaceRow, params.callerUserId)

    // Authorization: must be owner OR public
    if (!place.isOwner && !place.isPublic) return null
    return place
  }

  async function create(params: {
    userId: UserId
    input: CreatePlaceInput
  }): Promise<CoolPlaceResponse> {
    const [row] = await db
      .insert(coolPlace)
      .values({
        userId: params.userId,
        title: params.input.title,
        description: params.input.description ?? null,
        latitude: params.input.latitude,
        longitude: params.input.longitude,
        locationName: params.input.locationName ?? null,
        sourceUrl: params.input.sourceUrl ?? null,
        imageUrls: params.input.imageUrls ?? [],
        tags: params.input.tags ?? [],
        isPublic: params.input.isPublic ?? false,
      })
      .returning()

    if (!row) throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create place" })

    const userRow = await db.query.user.findFirst({
      where: (u, { eq }) => eq(u.id, params.userId),
      columns: { name: true },
    })

    return toCoolPlace(
      {
        ...row,
        creatorName: userRow?.name ?? "Unknown",
        visitCount: 0,
        lastVisitedAt: null,
      },
      params.userId
    )
  }

  async function update(params: {
    userId: UserId
    input: UpdatePlaceInput
  }): Promise<CoolPlaceResponse | null> {
    const { id, ...patch } = params.input

    const result = await db
      .update(coolPlace)
      .set({
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.description !== undefined
          ? { description: patch.description }
          : {}),
        ...(patch.locationName !== undefined
          ? { locationName: patch.locationName }
          : {}),
        ...(patch.sourceUrl !== undefined
          ? { sourceUrl: patch.sourceUrl }
          : {}),
        ...(patch.imageUrls !== undefined
          ? { imageUrls: patch.imageUrls }
          : {}),
        ...(patch.tags !== undefined ? { tags: patch.tags } : {}),
        ...(patch.isPublic !== undefined ? { isPublic: patch.isPublic } : {}),
      })
      .where(and(eq(coolPlace.id, id), eq(coolPlace.userId, params.userId)))
      .returning({ id: coolPlace.id })

    if (result.length === 0) return null
    return getById({ id, callerUserId: params.userId })
  }

  async function remove(params: { id: CoolPlaceId; userId: UserId }) {
    const result = await db
      .delete(coolPlace)
      .where(and(eq(coolPlace.id, params.id), eq(coolPlace.userId, params.userId)))
      .returning({ id: coolPlace.id })

    return result.length > 0
  }

  async function setPublic(params: {
    id: CoolPlaceId
    userId: UserId
    isPublic: boolean
  }) {
    const result = await db
      .update(coolPlace)
      .set({ isPublic: params.isPublic })
      .where(
        and(eq(coolPlace.id, params.id), eq(coolPlace.userId, params.userId))
      )
      .returning({ id: coolPlace.id })
    if (result.length === 0) return null
    return getById({ id: params.id, callerUserId: params.userId })
  }

  return { list, getById, create, update, remove, setPublic }
}

export type PlaceService = ReturnType<typeof createPlaceService>
