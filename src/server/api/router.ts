import type { RouterClient } from "@orpc/server"
import { publicProcedure } from "./api"
import { placeRouter } from "./routers/place.router"
import { visitRouter } from "./routers/visit.router"
import { pinterestRouter } from "./routers/pinterest.router"
import { tiktokRouter } from "./routers/tiktok.router"
import { importRouter } from "./routers/import.router"

export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  place: placeRouter,
  visit: visitRouter,
  pinterest: pinterestRouter,
  tiktok: tiktokRouter,
  // `import` is a TS reserved word at the top level but fine as an object key.
  import: importRouter,
}

export type AppRouter = typeof appRouter
export type AppRouterClient = RouterClient<typeof appRouter>
