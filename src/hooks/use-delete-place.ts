"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/lib/orpc"
import { toast } from "sonner"
import type { CoolPlaceId } from "@/lib/typeid"

export function useDeletePlace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: CoolPlaceId) => client.place.delete({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["places"] })
      toast.success("Place deleted")
    },
    onError: (error) => {
      toast.error("Failed to delete place", { description: error.message })
    },
  })
}
