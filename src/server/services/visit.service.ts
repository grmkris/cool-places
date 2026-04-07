import { and, desc, eq } from "drizzle-orm"
import type { CoolPlaceId, PlaceVisitId, UserId } from "@/lib/typeid"
import type { Database } from "../db/db"
import { coolPlace, placeVisit } from "../db/schema/place/place.db"
import { user } from "../db/schema/auth/auth.db"
import type {
  CreateVisitInput,
  PlaceVisitResponse,
} from "../db/schema/place/place.zod"

function toVisitResponse(
  row: typeof placeVisit.$inferSelect & { visitorName: string }
): PlaceVisitResponse {
  return {
    id: row.id,
    placeId: row.placeId,
    userId: row.userId,
    visitorName: row.visitorName,
    visitedAt: row.visitedAt.toISOString(),
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
  }
}

export type CreateVisitResult =
  | { ok: true; visit: PlaceVisitResponse }
  | { ok: false; reason: "not_found" | "forbidden" }

export function createVisitService(props: { db: Database }) {
  const { db } = props

  // Returns the caller's own visits to a place. Caller must own the place OR
  // the place must be public; otherwise returns []. Visits are private
  // per-user — even an owner doesn't see other users' visits to their public
  // place.
  async function listForPlace(params: {
    placeId: CoolPlaceId
    callerUserId: UserId
  }): Promise<PlaceVisitResponse[]> {
    const place = await db.query.coolPlace.findFirst({
      where: (p, { eq }) => eq(p.id, params.placeId),
      columns: { userId: true, isPublic: true },
    })
    if (!place) return []
    const isOwner = place.userId === params.callerUserId
    if (!isOwner && !place.isPublic) return []

    const rows = await db
      .select({
        id: placeVisit.id,
        placeId: placeVisit.placeId,
        userId: placeVisit.userId,
        visitedAt: placeVisit.visitedAt,
        notes: placeVisit.notes,
        createdAt: placeVisit.createdAt,
        updatedAt: placeVisit.updatedAt,
        visitorName: user.name,
      })
      .from(placeVisit)
      .innerJoin(user, eq(placeVisit.userId, user.id))
      .where(
        and(
          eq(placeVisit.placeId, params.placeId),
          eq(placeVisit.userId, params.callerUserId)
        )
      )
      .orderBy(desc(placeVisit.visitedAt))

    return rows.map(toVisitResponse)
  }

  async function create(params: {
    userId: UserId
    input: CreateVisitInput
  }): Promise<CreateVisitResult> {
    // Authorization: place must be readable by caller (owned or public).
    const place = await db.query.coolPlace.findFirst({
      where: (p, { eq }) => eq(p.id, params.input.placeId),
      columns: { userId: true, isPublic: true },
    })
    if (!place) return { ok: false, reason: "not_found" }
    if (place.userId !== params.userId && !place.isPublic) {
      return { ok: false, reason: "forbidden" }
    }

    const visitedAt = params.input.visitedAt
      ? new Date(params.input.visitedAt)
      : new Date()

    const [row] = await db
      .insert(placeVisit)
      .values({
        placeId: params.input.placeId,
        userId: params.userId,
        visitedAt,
        notes: params.input.notes ?? null,
      })
      .returning()

    if (!row) throw new Error("insert into place_visit returned no rows")

    const userRow = await db.query.user.findFirst({
      where: (u, { eq }) => eq(u.id, params.userId),
      columns: { name: true },
    })

    return {
      ok: true,
      visit: toVisitResponse({
        ...row,
        visitorName: userRow?.name ?? "Unknown",
      }),
    }
  }

  async function remove(params: { id: PlaceVisitId; userId: UserId }) {
    const result = await db
      .delete(placeVisit)
      .where(and(eq(placeVisit.id, params.id), eq(placeVisit.userId, params.userId)))
      .returning({ id: placeVisit.id })
    return result.length > 0
  }

  async function myRecent(params: { userId: UserId; limit?: number }) {
    const rows = await db
      .select({
        id: placeVisit.id,
        placeId: placeVisit.placeId,
        userId: placeVisit.userId,
        visitedAt: placeVisit.visitedAt,
        notes: placeVisit.notes,
        createdAt: placeVisit.createdAt,
        updatedAt: placeVisit.updatedAt,
        visitorName: user.name,
        placeTitle: coolPlace.title,
      })
      .from(placeVisit)
      .innerJoin(user, eq(placeVisit.userId, user.id))
      .innerJoin(coolPlace, eq(placeVisit.placeId, coolPlace.id))
      .where(eq(placeVisit.userId, params.userId))
      .orderBy(desc(placeVisit.visitedAt))
      .limit(params.limit ?? 25)

    return rows.map((r) => ({
      ...toVisitResponse(r),
      placeTitle: r.placeTitle,
    }))
  }

  return { listForPlace, create, remove, myRecent }
}

export type VisitService = ReturnType<typeof createVisitService>
