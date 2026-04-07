"use client"

import { useEffect } from "react"
import type { MapMouseEvent } from "maplibre-gl"
import { useMap } from "@/components/ui/map"

export function MapClickHandler({
  onClick,
  enabled = true,
}: {
  onClick: (lng: number, lat: number) => void
  enabled?: boolean
}) {
  const { map } = useMap()

  useEffect(() => {
    if (!map || !enabled) return
    const handler = (e: MapMouseEvent) => {
      onClick(e.lngLat.lng, e.lngLat.lat)
    }
    map.on("click", handler)
    return () => {
      map.off("click", handler)
    }
  }, [map, enabled, onClick])

  return null
}
