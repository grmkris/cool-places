import { ORPCError } from "@orpc/server"
import { z } from "zod"
import { CoolPlaceId, UserId } from "@/lib/typeid"
import {
  createPlaceInputSchema,
  listPlacesInputSchema,
  updatePlaceInputSchema,
} from "@/server/db/schema/place/place.zod"
import { authedProcedure } from "../api"

export const placeRouter = {
  list: authedProcedure
    .input(listPlacesInputSchema.optional())
    .handler(async ({ input, context }) => {
      const callerUserId = UserId.parse(context.session.user.id)
      context.log.set({ procedure: "place.list", filters: input })
      return context.placeService.list({ callerUserId, filters: input })
    }),

  getById: authedProcedure
    .input(z.object({ id: CoolPlaceId }))
    .handler(async ({ input, context }) => {
      const callerUserId = UserId.parse(context.session.user.id)
      context.log.set({ procedure: "place.getById", placeId: input.id })
      const place = await context.placeService.getById({
        id: input.id,
        callerUserId,
      })
      if (!place) {
        throw new ORPCError("NOT_FOUND", { message: "Place not found" })
      }
      return place
    }),

  create: authedProcedure
    .input(createPlaceInputSchema)
    .handler(async ({ input, context }) => {
      const userId = UserId.parse(context.session.user.id)
      context.log.set({ procedure: "place.create", userId })
      return context.placeService.create({ userId, input })
    }),

  update: authedProcedure
    .input(updatePlaceInputSchema)
    .handler(async ({ input, context }) => {
      const userId = UserId.parse(context.session.user.id)
      context.log.set({ procedure: "place.update", placeId: input.id })
      const updated = await context.placeService.update({ userId, input })
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
      const userId = UserId.parse(context.session.user.id)
      context.log.set({ procedure: "place.delete", placeId: input.id })
      const ok = await context.placeService.remove({ id: input.id, userId })
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
      const userId = UserId.parse(context.session.user.id)
      context.log.set({
        procedure: "place.setPublic",
        placeId: input.id,
        isPublic: input.isPublic,
      })
      const updated = await context.placeService.setPublic({
        id: input.id,
        userId,
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
