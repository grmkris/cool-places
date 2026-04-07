"use client"

import { createAuthClient } from "better-auth/react"
import type { BetterAuthClientPlugin } from "better-auth/client"
import type { siwe } from "better-auth/plugins"

export interface SessionUser {
  id: string
  name: string
  email: string
  image: string | null
}

// Extended siwe client that triggers session refresh after verify
const siweClientWithRefresh = () =>
  ({
    id: "siwe",
    $InferServerPlugin: {} as ReturnType<typeof siwe>,
    atomListeners: [
      {
        matcher: (path: string) => path === "/siwe/verify",
        signal: "$sessionSignal",
      },
    ],
  }) satisfies BetterAuthClientPlugin

export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined" ? window.location.origin : undefined,
  plugins: [siweClientWithRefresh()],
})

const { useSession: _useSession, signOut } = authClient

// Typed wrapper
function useSession() {
  const session = _useSession()
  return session as typeof session & {
    data: typeof session.data & {
      user: SessionUser
    } | null
  }
}

export { useSession, signOut }
