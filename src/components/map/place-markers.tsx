"use client"

import { useMemo } from "react"
import { MapClusterLayer } from "@/components/ui/map"
import type { CoolPlaceResponse } from "@/server/db/schema/place/place.zod"
import type { CoolPlaceId } from "@/lib/typeid"

type PlaceProps = {
  id: CoolPlaceId
  visited: boolean
  isPublic: boolean
}

export function PlaceMarkers({
  places,
  onSelectPlace,
}: {
  places: CoolPlaceResponse[]
  onSelectPlace: (placeId: CoolPlaceId) => void
}) {
  const data = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point, PlaceProps>>(
    () => ({
      type: "FeatureCollection",
      features: places.map((p) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: p.coordinates },
        properties: {
          id: p.id,
          visited: p.visitCount > 0,
          isPublic: p.isPublic,
        },
      })),
    }),
    [places]
  )

  if (places.length === 0) return null

  return (
    <MapClusterLayer<PlaceProps>
      data={data}
      clusterRadius={50}
      clusterMaxZoom={14}
      clusterColors={["#fb7185", "#f43f5e", "#e11d48"]}
      pointColor="#f43f5e"
      onPointClick={(feature) => onSelectPlace(feature.properties.id)}
    />
  )
}
