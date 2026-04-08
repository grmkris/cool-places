"use client"

import { useQuery } from "@tanstack/react-query"
import { client } from "@/lib/orpc"
import type { CoolPlaceId } from "@/lib/typeid"

export function usePlaceVisits(placeId: CoolPlaceId | null | undefined) {
  return useQuery({
    queryKey: ["visits", "forPlace", placeId],
    queryFn: () => client.visit.listForPlace({ placeId: placeId! }),
    enabled: !!placeId,
    staleTime: 30_000,
    meta: { errorMessage: "Failed to load visits" },
  })
}
