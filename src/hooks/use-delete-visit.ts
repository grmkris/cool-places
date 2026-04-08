"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/lib/orpc"
import { toast } from "sonner"
import type { CoolPlaceId, PlaceVisitId } from "@/lib/typeid"
import type { PlaceVisitResponse } from "@/server/db/schema/place/place.zod"
import type { CoolPlaceResponse } from "@/server/db/schema/place/place.zod"

export function useDeleteVisit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }: { id: PlaceVisitId; placeId: CoolPlaceId }) =>
      client.visit.delete({ id }),
    onMutate: async ({ id, placeId }) => {
      await queryClient.cancelQueries({
        queryKey: ["visits", "forPlace", placeId],
      })
      const prevVisits = queryClient.getQueryData<PlaceVisitResponse[]>([
        "visits",
        "forPlace",
        placeId,
      ])
      if (prevVisits) {
        queryClient.setQueryData<PlaceVisitResponse[]>(
          ["visits", "forPlace", placeId],
          prevVisits.filter((v) => v.id !== id)
        )
      }
      // Decrement visitCount in places cache
      await queryClient.cancelQueries({ queryKey: ["places"] })
      const prevPlaces = queryClient.getQueriesData<CoolPlaceResponse[]>({
        queryKey: ["places", "list"],
      })
      queryClient.setQueriesData<CoolPlaceResponse[]>(
        { queryKey: ["places", "list"] },
        (old) =>
          old?.map((p) =>
            p.id === placeId
              ? { ...p, visitCount: Math.max(0, p.visitCount - 1) }
              : p
          )
      )
      return { prevVisits, prevPlaces }
    },
    onError: (_err, { placeId }, ctx) => {
      if (ctx?.prevVisits) {
        queryClient.setQueryData(
          ["visits", "forPlace", placeId],
          ctx.prevVisits
        )
      }
      if (ctx?.prevPlaces) {
        for (const [key, data] of ctx.prevPlaces) {
          queryClient.setQueryData(key, data)
        }
      }
      toast.error("Failed to remove visit")
    },
    onSettled: (_data, _err, { placeId }) => {
      queryClient.invalidateQueries({
        queryKey: ["visits", "forPlace", placeId],
      })
      queryClient.invalidateQueries({ queryKey: ["visits", "myRecent"] })
      queryClient.invalidateQueries({ queryKey: ["places"] })
    },
    onSuccess: () => {
      toast.success("Visit removed")
    },
  })
}
