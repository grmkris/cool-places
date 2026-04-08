"use client"

import { useQuery } from "@tanstack/react-query"
import { client } from "@/lib/orpc"
import type { ListPlacesInput } from "@/server/db/schema/place/place.zod"

export function usePlaces(
  filters?: ListPlacesInput,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ["places", "list", filters ?? null],
    queryFn: async () => {
      const result = await client.place.list(filters)
      return result.items
    },
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
    refetchInterval: 60_000,
    meta: { errorMessage: "Failed to load places" },
  })
}
