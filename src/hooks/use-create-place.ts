"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/lib/orpc"
import { toast } from "sonner"

export function useCreatePlace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: Parameters<typeof client.place.create>[0]) =>
      client.place.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["places"] })
      toast.success("Place added")
    },
    onError: (error) => {
      toast.error("Failed to add place", { description: error.message })
    },
  })
}
