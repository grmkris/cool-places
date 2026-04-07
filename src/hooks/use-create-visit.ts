"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/lib/orpc"
import { toast } from "sonner"

export function useCreateVisit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: Parameters<typeof client.visit.create>[0]) =>
      client.visit.create(input),
    onSuccess: (_visit, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["visits", "forPlace", variables.placeId],
      })
      queryClient.invalidateQueries({ queryKey: ["visits", "myRecent"] })
      queryClient.invalidateQueries({ queryKey: ["places"] })
      toast.success("Visit recorded")
    },
    onError: (error) => {
      toast.error("Failed to record visit", { description: error.message })
    },
  })
}
