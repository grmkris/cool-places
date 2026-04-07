"use client"

import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { client } from "@/lib/orpc"
import { toast } from "sonner"

export function useMyRecentVisits(limit?: number) {
  const query = useQuery({
    queryKey: ["visits", "myRecent", limit ?? 25],
    queryFn: () => client.visit.myRecent({ limit }),
    staleTime: 30_000,
  })

  useEffect(() => {
    if (query.error) {
      toast.error("Failed to load recent visits", {
        description: query.error.message,
      })
    }
  }, [query.error])

  return query
}
