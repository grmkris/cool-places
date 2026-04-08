import { os, ORPCError } from "@orpc/server"
import { UserId } from "@/lib/typeid"
import { createRateLimiter } from "../rate-limit"
import type { Context } from "./context"

export const o = os.$context<Context>()
export const publicProcedure = o

export const authedProcedure = publicProcedure.use(
  async ({ context, next }) => {
    if (!context.session) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "Sign in to continue",
      })
    }
    const userId = UserId.parse(context.session.user.id)
    const userName = context.session.user.name ?? "Unknown"
    return next({
      context: {
        ...context,
        session: context.session as NonNullable<typeof context.session>,
        userId,
        userName,
      },
    })
  }
)

// Rate-limited authed procedure — 30 writes per user per minute
const writeLimiter = createRateLimiter({ windowMs: 60_000, max: 30 })

export const writeProcedure = authedProcedure.use(
  async ({ context, next }) => {
    const { ok } = writeLimiter.check(context.userId)
    if (!ok) {
      throw new ORPCError("TOO_MANY_REQUESTS", {
        message: "Too many requests. Please slow down.",
      })
    }
    return next()
  }
)
