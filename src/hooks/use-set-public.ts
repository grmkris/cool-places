"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/lib/orpc"
import { toast } from "sonner"
import type { CoolPlaceId } from "@/lib/typeid"
import type { CoolPlaceResponse } from "@/server/db/schema/place/place.zod"

export function useSetPublic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isPublic }: { id: CoolPlaceId; isPublic: boolean }) =>
      client.place.setPublic({ id, isPublic }),
    onMutate: async ({ id, isPublic }) => {
      await queryClient.cancelQueries({ queryKey: ["places"] })
      const prev = queryClient.getQueriesData<CoolPlaceResponse[]>({
        queryKey: ["places", "list"],
      })
      queryClient.setQueriesData<CoolPlaceResponse[]>(
        { queryKey: ["places", "list"] },
        (old) =>
          old?.map((p) => (p.id === id ? { ...p, isPublic } : p))
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        for (const [key, data] of ctx.prev) {
          queryClient.setQueryData(key, data)
        }
      }
      toast.error("Failed to update visibility")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["places"] })
    },
    onSuccess: (place) => {
      toast.success(place?.isPublic ? "Place is now public" : "Place is now private")
    },
  })
}
