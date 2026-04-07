import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import {
  type ExtractionResultId,
  type ImportedItemId,
  type PinterestBoardId,
  type PinterestConnectionId,
  type CoolPlaceId,
  type UserId,
  typeIdGenerator,
} from "@/lib/typeid"
import {
  baseEntityFields,
  createTimestampField,
  typeId,
} from "../../utils"
import { user } from "../auth/auth.db"
import { coolPlace } from "../place/place.db"

// --- Enums ---
export const importSourceEnum = pgEnum("import_source", [
  "pinterest_pin",
  "tiktok_url",
])

export const extractionStatusEnum = pgEnum("extraction_status", [
  "pending",
  "extracted",
  "failed",
  "needs_review",
])

export const extractionMethodEnum = pgEnum("extraction_method", [
  "json_ld",
  "google_maps_url",
  "llm",
  "hashtag_match",
  "geocoder",
])

// --- Imported Item: staging area for raw items from any source ---
export const importedItem = pgTable(
  "imported_item",
  {
    id: typeId("importedItem", "id")
      .primaryKey()
      .$defaultFn(() => typeIdGenerator("importedItem"))
      .$type<ImportedItemId>(),
    userId: typeId("user", "user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" })
      .$type<UserId>(),
    source: importSourceEnum("source").notNull(),
    sourceItemId: text("source_item_id").notNull(),
    rawData: jsonb("raw_data").$type<unknown>().notNull(),
    title: text("title"),
    description: text("description"),
    imageUrl: text("image_url"),
    link: text("link"),
    extractionStatus: extractionStatusEnum("extraction_status")
      .default("pending")
      .notNull(),
    coolPlaceId: typeId("coolPlace", "cool_place_id")
      .references(() => coolPlace.id, { onDelete: "set null" })
      .$type<CoolPlaceId>(),
    rejectedAt: createTimestampField("rejected_at"),
    ...baseEntityFields,
  },
  (table) => [
    index("importedItem_user_source_status_idx").on(
      table.userId,
      table.source,
      table.extractionStatus
    ),
    uniqueIndex("importedItem_user_source_sourceItemId_uniq").on(
      table.userId,
      table.source,
      table.sourceItemId
    ),
    index("importedItem_coolPlaceId_idx").on(table.coolPlaceId),
  ]
)

// --- Extraction Result: AI extraction output, 1:1 with imported_item ---
export const extractionResult = pgTable(
  "extraction_result",
  {
    id: typeId("extractionResult", "id")
      .primaryKey()
      .$defaultFn(() => typeIdGenerator("extractionResult"))
      .$type<ExtractionResultId>(),
    importedItemId: typeId("importedItem", "imported_item_id")
      .notNull()
      .references(() => importedItem.id, { onDelete: "cascade" })
      .$type<ImportedItemId>(),
    isPlace: boolean("is_place").notNull(),
    placeName: text("place_name"),
    address: text("address"),
    city: text("city"),
    country: text("country"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    confidence: numeric("confidence", { precision: 3, scale: 2 }).notNull(),
    extractionMethod: extractionMethodEnum("extraction_method").notNull(),
    model: text("model"),
    rawLlmOutput: jsonb("raw_llm_output").$type<unknown>(),
    errorMessage: text("error_message"),
    ...baseEntityFields,
  },
  (table) => [
    uniqueIndex("extractionResult_importedItemId_uniq").on(
      table.importedItemId
    ),
  ]
)

// --- Pinterest Connection: per-user Pinterest account metadata ---
export const pinterestConnection = pgTable(
  "pinterest_connection",
  {
    id: typeId("pinterestConnection", "id")
      .primaryKey()
      .$defaultFn(() => typeIdGenerator("pinterestConnection"))
      .$type<PinterestConnectionId>(),
    userId: typeId("user", "user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" })
      .$type<UserId>(),
    pinterestUserId: text("pinterest_user_id").notNull(),
    pinterestUsername: text("pinterest_username").notNull(),
    lastSyncedAt: createTimestampField("last_synced_at"),
    ...baseEntityFields,
  },
  (table) => [
    uniqueIndex("pinterestConnection_userId_uniq").on(table.userId),
  ]
)

// --- Pinterest Board: cached board metadata for the picker ---
export const pinterestBoard = pgTable(
  "pinterest_board",
  {
    id: typeId("pinterestBoard", "id")
      .primaryKey()
      .$defaultFn(() => typeIdGenerator("pinterestBoard"))
      .$type<PinterestBoardId>(),
    userId: typeId("user", "user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" })
      .$type<UserId>(),
    pinterestBoardId: text("pinterest_board_id").notNull(),
    name: text("name").notNull(),
    pinCount: integer("pin_count").default(0).notNull(),
    privacy: text("privacy").notNull(),
    selected: boolean("selected").default(false).notNull(),
    lastSyncedAt: createTimestampField("last_synced_at"),
    ...baseEntityFields,
  },
  (table) => [
    index("pinterestBoard_userId_idx").on(table.userId),
    uniqueIndex("pinterestBoard_user_boardId_uniq").on(
      table.userId,
      table.pinterestBoardId
    ),
  ]
)
