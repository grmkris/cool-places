import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(1),
    AUTH_DOMAIN: z.string().min(1),
    APP_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "production", "test"]),
    BLOB_READ_WRITE_TOKEN: z.string().min(1),
    // Pinterest OAuth (developers.pinterest.com) — optional for local dev without Pinterest
    PINTEREST_CLIENT_ID: z.string().min(1).optional(),
    PINTEREST_CLIENT_SECRET: z.string().min(1).optional(),
    // AI extraction via Vercel AI Gateway (optional until review queue is wired)
    AI_GATEWAY_API_KEY: z.string().min(1).optional(),
    EXTRACTION_MODEL: z.string().default("openai/gpt-4o-mini"),
    // Geocoding (optional until review queue is wired)
    MAPBOX_TOKEN: z.string().min(1).optional(),
    GEOCODER_PROVIDER: z.enum(["mapbox", "mock"]).default("mapbox"),
  },
  client: {
    NEXT_PUBLIC_REOWN_PROJECT_ID: z.string().min(1),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_REOWN_PROJECT_ID: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID,
  },
})
