import { betterAuth } from "better-auth"
import { siwe } from "better-auth/plugins"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { generateRandomString } from "better-auth/crypto"
import { createPublicClient, http } from "viem"
import { verifyMessage } from "viem/actions"
import { mainnet, base, baseSepolia } from "viem/chains"

import { DB_SCHEMA, type Database } from "./db/db"
import { fetchReownIdentity } from "@/lib/reown-identity"
import { env } from "@/env"

// Reown's RPC is gas-tuned for the deployless ERC-6492 verification eth_call
// used to verify embedded smart-wallet (Safe v1.4.1) signatures from social
// login. Generic RPCs (Infura free, Cloudflare, etc.) cap eth_call gas too
// low to simulate Safe deployment + isValidSignature in one call.
// Reference: https://github.com/reown-com/appkit-web-examples/blob/main/nextjs/next-siwe-next-auth/app/api/auth/%5B...nextauth%5D/route.ts
const reownRpc = (chainId: number) =>
  http(
    `https://rpc.walletconnect.org/v1/?chainId=eip155:${chainId}&projectId=${env.NEXT_PUBLIC_REOWN_PROJECT_ID}`,
    { timeout: 30_000, retryCount: 2 }
  )

const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: reownRpc(mainnet.id),
})

const baseClient = createPublicClient({
  chain: base,
  transport: reownRpc(base.id),
})

const baseSepoliaClient = createPublicClient({
  chain: baseSepolia,
  transport: reownRpc(baseSepolia.id),
})

// Dispatch the verifyMessage call per-chain. Returning a union of clients
// from a helper would force viem's generic inference to widen to a single
// chain type, which TypeScript rejects because the chain definitions differ
// (block explorer URLs, OP-stack getBlock shape, etc).
async function verifySignatureOnChain(args: {
  chainId: number
  address: `0x${string}`
  message: string
  signature: `0x${string}`
}) {
  const { chainId, ...rest } = args
  switch (chainId) {
    case base.id:
      return verifyMessage(baseClient, rest)
    case baseSepolia.id:
      return verifyMessage(baseSepoliaClient, rest)
    case mainnet.id:
    default:
      return verifyMessage(mainnetClient, rest)
  }
}

function ensureHexString(value: string): `0x${string}` {
  if (!value.startsWith("0x")) throw new Error(`Invalid hex string: ${value}`)
  return value as `0x${string}`
}

export function createAuth(props: {
  db: Database
  secret: string
  domain: string
  baseURL: string
}) {
  const { db, secret, domain, baseURL } = props

  return betterAuth({
    database: drizzleAdapter(db, { provider: "pg", schema: DB_SCHEMA }),
    secret,
    baseURL,
    trustedOrigins: domain === "localhost" ? [] : [baseURL],
    plugins: [
      siwe({
        domain,
        emailDomainName: `wallet.${domain}`,
        anonymous: true,
        getNonce: async () => {
          return generateRandomString(32, "a-z", "A-Z", "0-9")
        },
        verifyMessage: async ({ message, signature, address, chainId }) => {
          // Sanity check: hex must be even-length. Catches transcription bugs.
          if (
            !signature.startsWith("0x") ||
            (signature.length - 2) % 2 !== 0
          ) {
            console.error("[siwe] signature is not valid hex", {
              length: signature.length,
            })
            return false
          }
          // Nonce validation is handled by better-auth's SIWE plugin layer
          // (it checks a valid, non-expired verification record exists before
          // calling this callback). This callback only does cryptographic
          // signature verification via viem.
          const isErc6492 = signature.endsWith(
            "6492649264926492649264926492649264926492649264926492649264926492"
          )
          // Use viem's smart-wallet-aware verifyMessage action so that
          // ERC-1271 / ERC-6492 signatures from embedded smart wallets
          // (Reown social login) verify correctly. Falls back to mainnet
          // if the chain isn't in our supported set.
          try {
            const ok = await verifySignatureOnChain({
              chainId,
              address: ensureHexString(address),
              message,
              signature: ensureHexString(signature),
            })
            if (!ok) {
              console.warn("[siwe] verifyMessage returned false", {
                address,
                chainId,
                isErc6492,
              })
            }
            return ok
          } catch (err) {
            console.error("[siwe] verifyMessage threw", {
              name: (err as Error)?.name,
              message: (err as Error)?.message,
              cause: (err as Error & { cause?: Error })?.cause?.message,
              address,
              chainId,
              isErc6492,
            })
            return false
          }
        },
        ensLookup: async ({ walletAddress }) => {
          // Reown's Identity API aggregates ENS, CCIP-read offchain names, and
          // Reown profile names in one call. Reuses our existing project id —
          // no Infura roundtrip, no extra RPC tuning.
          const { name, avatar } = await fetchReownIdentity(walletAddress)
          return {
            name: name ?? walletAddress,
            avatar: avatar ?? "",
          }
        },
      }),
    ],
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      cookieCache: { enabled: true, maxAge: 5 * 60 }, // 5 min
    },
    advanced: {
      database: { generateId: false },
      cookies: {
        session_token: {
          attributes: {
            sameSite: "lax" as const,
            secure: env.NODE_ENV === "production",
          },
        },
      },
    },
  })
}

export type Auth = ReturnType<typeof createAuth>
