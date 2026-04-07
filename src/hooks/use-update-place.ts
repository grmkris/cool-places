"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/lib/orpc"
import { toast } from "sonner"

export function useUpdatePlace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: Parameters<typeof client.place.update>[0]) =>
      client.place.update(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["places"] })
      toast.success("Place updated")
    },
    onError: (error) => {
      toast.error("Failed to update place", { description: error.message })
    },
  })
}
