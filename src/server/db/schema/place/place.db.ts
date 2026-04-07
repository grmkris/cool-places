import {
  boolean,
  doublePrecision,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"
import {
  type CoolPlaceId,
  type PlaceVisitId,
  type UserId,
  typeIdGenerator,
} from "@/lib/typeid"
import { baseEntityFields, typeId } from "../../utils"
import { user } from "../auth/auth.db"

// --- Cool Place ---
export const coolPlace = pgTable(
  "cool_place",
  {
    id: typeId("coolPlace", "id")
      .primaryKey()
      .$defaultFn(() => typeIdGenerator("coolPlace"))
      .$type<CoolPlaceId>(),
    userId: typeId("user", "user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" })
      .$type<UserId>(),
    title: text("title").notNull(),
    description: text("description"),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    locationName: text("location_name"),
    sourceUrl: text("source_url"),
    imageUrls: jsonb("image_urls").$type<string[]>().default([]).notNull(),
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
    isPublic: boolean("is_public").default(false).notNull(),
    ...baseEntityFields,
  },
  (table) => [
    index("coolPlace_userId_idx").on(table.userId),
    index("coolPlace_isPublic_idx").on(table.isPublic),
    index("coolPlace_userId_createdAt_idx").on(table.userId, table.createdAt),
  ]
)

// --- Place Visit ---
export const placeVisit = pgTable(
  "place_visit",
  {
    id: typeId("placeVisit", "id")
      .primaryKey()
      .$defaultFn(() => typeIdGenerator("placeVisit"))
      .$type<PlaceVisitId>(),
    placeId: typeId("coolPlace", "place_id")
      .notNull()
      .references(() => coolPlace.id, { onDelete: "cascade" })
      .$type<CoolPlaceId>(),
    userId: typeId("user", "user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" })
      .$type<UserId>(),
    visitedAt: timestamp("visited_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    notes: text("notes"),
    ...baseEntityFields,
  },
  (table) => [
    index("placeVisit_placeId_idx").on(table.placeId),
    index("placeVisit_userId_idx").on(table.userId),
    index("placeVisit_userId_visitedAt_idx").on(
      table.userId,
      table.visitedAt
    ),
  ]
)
