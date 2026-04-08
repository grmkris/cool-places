import { ORPCError } from "@orpc/server"
import { z } from "zod"
import { CoolPlaceId } from "@/lib/typeid"
import {
  createPlaceInputSchema,
  listPlacesInputSchema,
  updatePlaceInputSchema,
} from "@/server/db/schema/place/place.zod"
import { authedProcedure, writeProcedure } from "../api"

export const placeRouter = {
  list: authedProcedure
    .input(listPlacesInputSchema.optional())
    .handler(async ({ input, context }) => {
      context.log.set({ procedure: "place.list", filters: input })
      return context.placeService.list({ callerUserId: context.userId, filters: input })
    }),

  getById: authedProcedure
    .input(z.object({ id: CoolPlaceId }))
    .handler(async ({ input, context }) => {
      context.log.set({ procedure: "place.getById", placeId: input.id })
      const place = await context.placeService.getById({
        id: input.id,
        callerUserId: context.userId,
      })
      if (!place) {
        throw new ORPCError("NOT_FOUND", { message: "Place not found" })
      }
      return place
    }),

  create: writeProcedure
    .input(createPlaceInputSchema)
    .handler(async ({ input, context }) => {
      context.log.set({ procedure: "place.create", userId: context.userId })
      return context.placeService.create({ userId: context.userId, userName: context.userName, input })
    }),

  update: authedProcedure
    .input(updatePlaceInputSchema)
    .handler(async ({ input, context }) => {
      context.log.set({ procedure: "place.update", placeId: input.id })
      const updated = await context.placeService.update({ userId: context.userId, input })
      if (!updated) {
        throw new ORPCError("NOT_FOUND", {
          message: "Place not found or not yours",
        })
      }
      return updated
    }),

  delete: authedProcedure
    .input(z.object({ id: CoolPlaceId }))
    .handler(async ({ input, context }) => {
      context.log.set({ procedure: "place.delete", placeId: input.id })
      const ok = await context.placeService.remove({ id: input.id, userId: context.userId })
      if (!ok) {
        throw new ORPCError("NOT_FOUND", {
          message: "Place not found or not yours",
        })
      }
      return { success: true as const }
    }),

  setPublic: authedProcedure
    .input(z.object({ id: CoolPlaceId, isPublic: z.boolean() }))
    .handler(async ({ input, context }) => {
      context.log.set({
        procedure: "place.setPublic",
        placeId: input.id,
        isPublic: input.isPublic,
      })
      const updated = await context.placeService.setPublic({
        id: input.id,
        userId: context.userId,
        isPublic: input.isPublic,
      })
      if (!updated) {
        throw new ORPCError("NOT_FOUND", {
          message: "Place not found or not yours",
        })
      }
      return updated
    }),
}
