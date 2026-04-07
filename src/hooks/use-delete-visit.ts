"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/lib/orpc"
import { toast } from "sonner"
import type { PlaceVisitId } from "@/lib/typeid"

export function useDeleteVisit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: PlaceVisitId) => client.visit.delete({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visits"] })
      queryClient.invalidateQueries({ queryKey: ["places"] })
      toast.success("Visit removed")
    },
    onError: (error) => {
      toast.error("Failed to remove visit", { description: error.message })
    },
  })
}
