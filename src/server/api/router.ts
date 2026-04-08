import type { RouterClient } from "@orpc/server"
import { publicProcedure } from "./api"
import { placeRouter } from "./routers/place.router"
import { visitRouter } from "./routers/visit.router"

export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  place: placeRouter,
  visit: visitRouter,
}

export type AppRouter = typeof appRouter
export type AppRouterClient = RouterClient<typeof appRouter>
