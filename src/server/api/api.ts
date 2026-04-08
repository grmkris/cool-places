import { os, ORPCError } from "@orpc/server"
import { UserId } from "@/lib/typeid"
import type { Context } from "./context"

export const o = os.$context<Context>()
export const publicProcedure = o

export const authedProcedure = publicProcedure.use(
  async ({ context, next }) => {
    if (!context.session) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "Connect wallet to continue",
      })
    }
    const userId = UserId.parse(context.session.user.id)
    return next({
      context: {
        ...context,
        session: context.session as NonNullable<typeof context.session>,
        userId,
      },
    })
  }
)
