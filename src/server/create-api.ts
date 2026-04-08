import { Hono } from "hono"
import { cors } from "hono/cors"
import { createError, parseError } from "evlog"
import { evlog, type EvlogVariables } from "evlog/hono"
import type { ContentfulStatusCode } from "hono/utils/http-status"
import { RPCHandler } from "@orpc/server/fetch"
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { UPLOAD_MAX_SIZE_BYTES, UPLOAD_ALLOWED_TYPES } from "@/lib/upload-config"
import { createContext } from "./api/context"
import { appRouter } from "./api/router"
import { createAuth } from "./auth"
import { createPlaceService } from "./services/place.service"
import { createVisitService } from "./services/visit.service"
import { env } from "@/env"
import { UserId } from "@/lib/typeid"
import type { Database } from "./db/db"

export function createApi(props: { db: Database }) {
  const { db } = props

  // --- Services ---
  const placeService = createPlaceService({ db })
  const visitService = createVisitService({ db })

  // --- Auth ---
  const auth = createAuth({
    db,
    secret: env.BETTER_AUTH_SECRET,
    domain: env.AUTH_DOMAIN,
    baseURL: env.APP_URL,
  })

  // --- Hono app with evlog wide events ---
  const app = new Hono<EvlogVariables>().basePath("/api")

  app.use(
    "*",
    cors({
      origin: env.AUTH_DOMAIN === "localhost"
        ? ["http://localhost:3000"]
        : [env.APP_URL],
      credentials: true,
    })
  )
  app.use("*", evlog({ exclude: ["/api/health"] }))

  // Structured error handler — only expose details for known oRPC/API errors;
  // unknown errors get a generic message so internals don't leak to the client.
  app.onError((error, c) => {
    c.get("log").error(error)
    const parsed = parseError(error)
    const status = (parsed.status >= 100 && parsed.status < 600
      ? parsed.status
      : 500) as ContentfulStatusCode
    const isKnown = status < 500
    return c.json(
      {
        message: isKnown ? parsed.message : "Internal server error",
        ...(isKnown && parsed.why ? { why: parsed.why } : {}),
        ...(isKnown && parsed.fix ? { fix: parsed.fix } : {}),
      },
      status
    )
  })

  app.get("/health", (c) => c.json({ status: "ok" }))

  // Better Auth handles /api/auth/*
  app.all("/auth/*", async (c) => auth.handler(c.req.raw))

  // Image upload (Vercel Blob client-upload pattern)
  app.post("/upload", async (c) => {
    const log = c.get("log")
    log.set({ action: "upload" })

    const session = await auth.api.getSession({ headers: c.req.raw.headers })
    if (!session) {
      throw createError({ message: "Not authenticated", status: 401 })
    }
    const userId = UserId.parse(session.user.id)
    log.set({ userId })

    const body = (await c.req.json()) as HandleUploadBody

    const jsonResponse = await handleUpload({
      body,
      request: c.req.raw,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [...UPLOAD_ALLOWED_TYPES],
        maximumSizeInBytes: UPLOAD_MAX_SIZE_BYTES,
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {},
    })

    return c.json(jsonResponse)
  })

  // oRPC handler
  const rpcHandler = new RPCHandler(appRouter)
  app.all("/rpc/*", async (c) => {
    const log = c.get("log")
    const session = await auth.api.getSession({ headers: c.req.raw.headers })
    const context = createContext({
      log,
      auth,
      placeService,
      visitService,
      session,
    })

    const { matched, response } = await rpcHandler.handle(c.req.raw, {
      prefix: "/api/rpc",
      context,
    })

    if (matched) return response
    return c.notFound()
  })

  return { app, auth, db }
}
