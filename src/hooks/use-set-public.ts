"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/lib/orpc"
import { toast } from "sonner"
import type { CoolPlaceId } from "@/lib/typeid"

export function useSetPublic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isPublic }: { id: CoolPlaceId; isPublic: boolean }) =>
      client.place.setPublic({ id, isPublic }),
    onSuccess: (place) => {
      queryClient.invalidateQueries({ queryKey: ["places"] })
      toast.success(place?.isPublic ? "Place is now public" : "Place is now private")
    },
    onError: (error) => {
      toast.error("Failed to update visibility", { description: error.message })
    },
  })
}
