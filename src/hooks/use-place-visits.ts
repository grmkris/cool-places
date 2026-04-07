"use client"

import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { client } from "@/lib/orpc"
import type { CoolPlaceId } from "@/lib/typeid"
import { toast } from "sonner"

export function usePlaceVisits(placeId: CoolPlaceId | null | undefined) {
  const query = useQuery({
    queryKey: ["visits", "forPlace", placeId],
    queryFn: () => {
      if (!placeId) throw new Error("placeId required")
      return client.visit.listForPlace({ placeId })
    },
    enabled: !!placeId,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (query.error) {
      toast.error("Failed to load visits", {
        description: query.error.message,
      })
    }
  }, [query.error])

  return query
}
