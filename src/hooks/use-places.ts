"use client"

import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { client } from "@/lib/orpc"
import type { ListPlacesInput } from "@/server/db/schema/place/place.zod"
import { toast } from "sonner"

export function usePlaces(
  filters?: ListPlacesInput,
  options?: { enabled?: boolean }
) {
  const query = useQuery({
    queryKey: ["places", "list", filters ?? null],
    queryFn: async () => {
      const result = await client.place.list(filters)
      return result.items
    },
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  useEffect(() => {
    if (query.error) {
      toast.error("Failed to load places", {
        description: query.error.message,
      })
    }
  }, [query.error])

  return query
}
