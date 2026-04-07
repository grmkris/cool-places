import { z } from "zod"
import {
  CoolPlaceId,
  ImportedItemId,
  PinterestBoardId,
  UserId,
} from "@/lib/typeid"

// --- Enums ---
export const importSourceSchema = z.enum(["pinterest_pin", "tiktok_url"])
export type ImportSource = z.infer<typeof importSourceSchema>

export const extractionStatusSchema = z.enum([
  "pending",
  "extracted",
  "failed",
  "needs_review",
])
export type ExtractionStatus = z.infer<typeof extractionStatusSchema>

export const extractionMethodSchema = z.enum([
  "json_ld",
  "google_maps_url",
  "llm",
  "hashtag_match",
  "geocoder",
])
export type ExtractionMethod = z.infer<typeof extractionMethodSchema>

// --- Imported item response (joined with extraction_result) ---
export const importedItemResponseSchema = z.object({
  id: ImportedItemId,
  userId: UserId,
  source: importSourceSchema,
  sourceItemId: z.string(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  link: z.string().nullable(),
  extractionStatus: extractionStatusSchema,
  coolPlaceId: CoolPlaceId.nullable(),
  rejectedAt: z.string().nullable(),
  // Joined extraction result fields (flattened)
  isPlace: z.boolean().nullable(),
  placeName: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  confidence: z.number().nullable(),
  extractionMethod: extractionMethodSchema.nullable(),
  model: z.string().nullable(),
  errorMessage: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type ImportedItemResponse = z.infer<typeof importedItemResponseSchema>

// --- List filters ---
export const listImportedInputSchema = z.object({
  source: importSourceSchema.optional(),
  status: extractionStatusSchema.optional(),
  cursor: ImportedItemId.optional(),
  limit: z.number().int().min(1).max(200).optional(),
})
export type ListImportedInput = z.infer<typeof listImportedInputSchema>

// --- Promote to coolPlace ---
export const promoteImportedInputSchema = z.object({
  importedItemId: ImportedItemId,
  overrides: z
    .object({
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(2000).nullable().optional(),
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
      locationName: z.string().max(200).nullable().optional(),
      sourceUrl: z.string().url().max(2000).nullable().optional(),
      imageUrls: z.array(z.string().url()).max(10).optional(),
      tags: z.array(z.string().min(1).max(50)).max(20).optional(),
      isPublic: z.boolean().optional(),
    })
    .optional(),
})
export type PromoteImportedInput = z.infer<typeof promoteImportedInputSchema>

export const bulkPromoteInputSchema = z.object({
  importedItemIds: z.array(ImportedItemId).min(1).max(200),
})
export type BulkPromoteInput = z.infer<typeof bulkPromoteInputSchema>

// --- Pinterest board ---
export const pinterestBoardResponseSchema = z.object({
  id: PinterestBoardId,
  pinterestBoardId: z.string(),
  name: z.string(),
  pinCount: z.number(),
  privacy: z.string(),
  selected: z.boolean(),
  lastSyncedAt: z.string().nullable(),
})
export type PinterestBoardResponse = z.infer<
  typeof pinterestBoardResponseSchema
>

export const setBoardSelectionInputSchema = z.object({
  boardIds: z.array(PinterestBoardId),
})
export type SetBoardSelectionInput = z.infer<typeof setBoardSelectionInputSchema>

// --- Pinterest sync ---
export const pinterestSyncResumeCursorSchema = z.object({
  boardId: PinterestBoardId,
  bookmark: z.string().nullable(),
})
export type PinterestSyncResumeCursor = z.infer<
  typeof pinterestSyncResumeCursorSchema
>

export const pinterestSyncInputSchema = z.object({
  resumeCursor: pinterestSyncResumeCursorSchema.optional(),
})
export type PinterestSyncInput = z.infer<typeof pinterestSyncInputSchema>

export const pinterestSyncResultSchema = z.object({
  done: z.boolean(),
  resumeCursor: pinterestSyncResumeCursorSchema.optional(),
  newItems: z.number(),
  totalItems: z.number(),
  syncedBoards: z.number(),
})
export type PinterestSyncResult = z.infer<typeof pinterestSyncResultSchema>

// --- TikTok enrich ---
export const tiktokEnrichInputSchema = z.object({
  url: z.string().url(),
})
export type TikTokEnrichInput = z.infer<typeof tiktokEnrichInputSchema>

export const tiktokEnrichBatchInputSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(50),
})
export type TikTokEnrichBatchInput = z.infer<typeof tiktokEnrichBatchInputSchema>

// --- Extraction polling ---
export const extractPendingInputSchema = z.object({
  limit: z.number().int().min(1).max(50).default(10),
})
export type ExtractPendingInput = z.infer<typeof extractPendingInputSchema>

// --- Status counts ---
export const importStatusCountsSchema = z.object({
  pending: z.number(),
  extracted: z.number(),
  failed: z.number(),
  needsReview: z.number(),
  total: z.number(),
})
export type ImportStatusCounts = z.infer<typeof importStatusCountsSchema>
