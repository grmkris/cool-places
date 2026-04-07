import { ORPCError } from "@orpc/server"
import { z } from "zod"
import { CoolPlaceId, PlaceVisitId, UserId } from "@/lib/typeid"
import { createVisitInputSchema } from "@/server/db/schema/place/place.zod"
import { authedProcedure } from "../api"

export const visitRouter = {
  listForPlace: authedProcedure
    .input(z.object({ placeId: CoolPlaceId }))
    .handler(async ({ input, context }) => {
      const callerUserId = UserId.parse(context.session.user.id)
      context.log.set({ procedure: "visit.listForPlace", placeId: input.placeId })
      return context.visitService.listForPlace({
        placeId: input.placeId,
        callerUserId,
      })
    }),

  create: authedProcedure
    .input(createVisitInputSchema)
    .handler(async ({ input, context }) => {
      const userId = UserId.parse(context.session.user.id)
      context.log.set({ procedure: "visit.create", placeId: input.placeId })
      const result = await context.visitService.create({ userId, input })
      if (!result.ok) {
        if (result.reason === "not_found") {
          throw new ORPCError("NOT_FOUND", { message: "Place not found" })
        }
        throw new ORPCError("FORBIDDEN", {
          message: "Not allowed to visit this place",
        })
      }
      return result.visit
    }),

  delete: authedProcedure
    .input(z.object({ id: PlaceVisitId }))
    .handler(async ({ input, context }) => {
      const userId = UserId.parse(context.session.user.id)
      context.log.set({ procedure: "visit.delete", visitId: input.id })
      const ok = await context.visitService.remove({ id: input.id, userId })
      if (!ok) {
        throw new ORPCError("NOT_FOUND", {
          message: "Visit not found or not yours",
        })
      }
      return { success: true as const }
    }),

  myRecent: authedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).optional() }).optional())
    .handler(async ({ input, context }) => {
      const userId = UserId.parse(context.session.user.id)
      context.log.set({ procedure: "visit.myRecent" })
      return context.visitService.myRecent({ userId, limit: input?.limit })
    }),
}
