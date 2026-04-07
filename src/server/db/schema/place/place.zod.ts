import { z } from "zod"
import { CoolPlaceId, PlaceVisitId, UserId } from "@/lib/typeid"

// --- API response schema (DB stores lat/lng separately, API returns coordinates tuple) ---
export const coolPlaceResponseSchema = z.object({
  id: CoolPlaceId,
  userId: UserId,
  title: z.string(),
  description: z.string().nullable(),
  /** [longitude, latitude] — MapLibre/GeoJSON convention */
  coordinates: z.tuple([z.number(), z.number()]),
  locationName: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  imageUrls: z.array(z.string()),
  tags: z.array(z.string()),
  isPublic: z.boolean(),
  visitCount: z.number(),
  lastVisitedAt: z.string().nullable(),
  isOwner: z.boolean(),
  creatorName: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type CoolPlaceResponse = z.infer<typeof coolPlaceResponseSchema>

// --- Create input ---
export const createPlaceInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  locationName: z.string().max(200).optional().nullable(),
  sourceUrl: z.string().url().max(2000).optional().nullable(),
  imageUrls: z.array(z.string().url()).max(10).optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
  isPublic: z.boolean().optional(),
})

export type CreatePlaceInput = z.infer<typeof createPlaceInputSchema>

// --- Update input ---
export const updatePlaceInputSchema = z.object({
  id: CoolPlaceId,
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  locationName: z.string().max(200).nullable().optional(),
  sourceUrl: z.string().url().max(2000).nullable().optional(),
  imageUrls: z.array(z.string().url()).max(10).optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
  isPublic: z.boolean().optional(),
})

export type UpdatePlaceInput = z.infer<typeof updatePlaceInputSchema>

// --- List filters ---
export const listPlacesInputSchema = z.object({
  includePublic: z.boolean().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  visitedFilter: z.enum(["all", "visited", "unvisited"]).optional(),
  limit: z.number().int().min(1).max(500).optional(),
  cursor: CoolPlaceId.optional(),
})

export type ListPlacesInput = z.infer<typeof listPlacesInputSchema>

// --- Visit response ---
export const placeVisitResponseSchema = z.object({
  id: PlaceVisitId,
  placeId: CoolPlaceId,
  userId: UserId,
  visitorName: z.string(),
  visitedAt: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string(),
})

export type PlaceVisitResponse = z.infer<typeof placeVisitResponseSchema>

// --- Visit create input ---
export const createVisitInputSchema = z.object({
  placeId: CoolPlaceId,
  visitedAt: z.string().datetime().optional(),
  notes: z.string().max(1000).optional().nullable(),
})

export type CreateVisitInput = z.infer<typeof createVisitInputSchema>
