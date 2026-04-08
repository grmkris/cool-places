"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/lib/orpc"
import { toast } from "sonner"
import type { CoolPlaceResponse } from "@/server/db/schema/place/place.zod"

export function useCreateVisit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: Parameters<typeof client.visit.create>[0]) =>
      client.visit.create(input),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["places"] })
      const prev = queryClient.getQueriesData<CoolPlaceResponse[]>({
        queryKey: ["places", "list"],
      })
      queryClient.setQueriesData<CoolPlaceResponse[]>(
        { queryKey: ["places", "list"] },
        (old) =>
          old?.map((p) =>
            p.id === variables.placeId
              ? { ...p, visitCount: p.visitCount + 1 }
              : p
          )
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        for (const [key, data] of ctx.prev) {
          queryClient.setQueryData(key, data)
        }
      }
      toast.error("Failed to record visit")
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["visits", "forPlace", variables.placeId],
      })
      queryClient.invalidateQueries({ queryKey: ["visits", "myRecent"] })
      queryClient.invalidateQueries({ queryKey: ["places"] })
    },
    onSuccess: () => {
      toast.success("Visit recorded")
    },
  })
}
