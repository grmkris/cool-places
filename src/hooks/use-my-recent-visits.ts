"use client"

import { useQuery } from "@tanstack/react-query"
import { client } from "@/lib/orpc"

export function useMyRecentVisits(limit?: number) {
  return useQuery({
    queryKey: ["visits", "myRecent", limit ?? 25],
    queryFn: () => client.visit.myRecent({ limit }),
    staleTime: 30_000,
    meta: { errorMessage: "Failed to load recent visits" },
  })
}
