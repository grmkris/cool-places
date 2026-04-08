"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useQueryState } from "nuqs"
import { parseAsCoolPlaceId } from "@/lib/nuqs-parsers"
import { Map, MapControls, useMap, type MapRef } from "@/components/ui/map"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import type { CoolPlaceId } from "@/lib/typeid"
import { usePlaces } from "@/hooks/use-places"
import {
  usePlaceFilterResult,
  usePlaceFilterState,
} from "@/hooks/use-place-filters"
import { useSession } from "@/lib/auth-client"
import { useAppKit } from "@reown/appkit/react"
import { ArrowRightIcon, MapPinIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { AddPlaceSheet } from "./add-place-sheet"
import { PlaceDetailPanel } from "./place-detail-panel"
import { PlaceMarkers } from "./place-markers"
import { MapClickHandler } from "./map-click-handler"
import { PlaceSidebar } from "./place-sidebar"
import { UserControls } from "@/components/user-controls"
import { BottomNav } from "@/components/bottom-nav"

const WORLD_CENTER: [number, number] = [0, 20]

function MapFlyTo({ target }: { target: [number, number] | null }) {
  const { map } = useMap()
  useEffect(() => {
    if (target && map) {
      map.flyTo({
        center: target,
        zoom: Math.max(map.getZoom(), 14),
        duration: 1000,
      })
    }
  }, [target, map])
  return null
}

export function PlaceMap() {
  const { data: sessionData, isPending: sessionPending } = useSession()
  const isSignedIn = !!sessionData?.session
  const { open: openAppKit } = useAppKit()
  const mapRef = useRef<MapRef>(null)

  const filterState = usePlaceFilterState()
  const {
    searchQuery,
    setSearchQuery,
    activeTags,
    toggleTag,
    visitedFilter,
    setVisitedFilter,
    showPublic,
    toggleShowPublic,
    clearFilters,
  } = filterState

  const listInput = useMemo(
    () => ({
      includePublic: showPublic,
      search: searchQuery || undefined,
      tags: activeTags.size > 0 ? Array.from(activeTags).sort() : undefined,
      visitedFilter,
    }),
    [showPublic, searchQuery, activeTags, visitedFilter]
  )

  const placesQuery = usePlaces(listInput, { enabled: isSignedIn })
  const places = placesQuery.data ?? []
  const isLoading = isSignedIn && placesQuery.isLoading

  const { filteredPlaces, allTags } = usePlaceFilterResult(places, {
    searchQuery,
    activeTags,
    visitedFilter,
  })

  const [selectedPlaceId, setSelectedPlaceId] = useQueryState(
    "place",
    parseAsCoolPlaceId
  )

  const searchParams = useSearchParams()
  const addPlaceParam = searchParams.get("addPlace")
  const prefilledImage = searchParams.get("image")

  const [addSheetOpen, setAddSheetOpen] = useState(false)
  const [pinMode, setPinMode] = useState(false)
  const [clickedCoords, setClickedCoords] = useState<[number, number] | null>(
    null
  )

  // Auto-open add sheet when navigated from /capture with ?addPlace=true
  const addSheetTriggered = useRef(false)
  useEffect(() => {
    if (addPlaceParam === "true" && !addSheetTriggered.current && isSignedIn) {
      addSheetTriggered.current = true
      setAddSheetOpen(true)
    }
  }, [addPlaceParam, isSignedIn])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [flyToTarget, setFlyToTarget] = useState<[number, number] | null>(null)

  const initialFlyDone = useRef(false)

  useEffect(() => {
    if (!initialFlyDone.current && selectedPlaceId && places.length > 0) {
      const place = places.find((p) => p.id === selectedPlaceId)
      if (place) {
        setFlyToTarget([...place.coordinates])
        initialFlyDone.current = true
      }
    }
  }, [selectedPlaceId, places])

  const selectedPlace = selectedPlaceId
    ? (places.find((p) => p.id === selectedPlaceId) ?? null)
    : null

  const handleMapClick = useCallback(
    (lng: number, lat: number) => {
      if (!pinMode) return
      setClickedCoords([lng, lat])
      setPinMode(false)
      setAddSheetOpen(true)
    },
    [pinMode]
  )

  const handleSelectPlace = useCallback(
    (placeId: CoolPlaceId | null) => {
      setSelectedPlaceId(placeId)
      if (placeId) {
        const place = places.find((p) => p.id === placeId)
        if (place) setFlyToTarget([...place.coordinates])
      }
    },
    [setSelectedPlaceId, places]
  )

  const handleCloseDetail = useCallback(() => {
    setSelectedPlaceId(null)
  }, [setSelectedPlaceId])

  const handleOpenAddSheet = useCallback(() => {
    setClickedCoords(null)
    setAddSheetOpen(true)
  }, [])

  const handleRequestPinMode = useCallback(() => {
    setPinMode(true)
  }, [])

  const handleAddSheetClose = useCallback((open: boolean) => {
    setAddSheetOpen(open)
    if (!open) {
      setPinMode(false)
      setClickedCoords(null)
    }
  }, [])

  // ── Unauth landing ──
  if (!sessionPending && !isSignedIn) {
    return (
      <div className="relative h-svh w-svw overflow-hidden">
        <Map
          center={[15, 38] as [number, number]}
          zoom={4}
          minZoom={3}
          maxZoom={6}
          className="h-full w-full"
        />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
          <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-border/30 bg-background/80 p-6 text-center shadow-2xl backdrop-blur-xl">
            <MapPinIcon size={28} className="mx-auto mb-3 text-[#c8956c]" />
            <h1 className="text-lg font-semibold tracking-tight">
              Cool Places
            </h1>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
              Pin the places you love. Collect memories.
            </p>
            <Button
              onClick={() => openAppKit()}
              className="mt-5 w-full gap-2"
              style={{ backgroundColor: "#c8956c" }}
            >
              Get started
              <ArrowRightIcon size={14} />
            </Button>
            <p className="mt-3 text-[10px] text-muted-foreground/60">
              Takes 10 seconds. No app to download.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="flex h-svh w-svw bg-background">
        <div className="hidden w-80 border-r border-border/50 p-3 sm:block">
          <div className="space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-10 w-full rounded-3xl" />
            <Separator />
            <div className="space-y-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-14 w-full"
                  style={{ animationDelay: `${i * 75}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center bg-muted/20">
          <div className="flex flex-col items-center gap-3">
            <Spinner className="size-5" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Loading
            </span>
          </div>
        </div>
      </div>
    )
  }

  // ── Authenticated map ──
  return (
    <div className="relative flex h-svh w-svw flex-col">
      <div className="absolute top-2 right-2 z-controls">
        <UserControls />
      </div>

      <PlaceSidebar
        filteredPlaces={filteredPlaces}
        selectedPlaceId={selectedPlaceId}
        searchQuery={searchQuery}
        allTags={allTags}
        activeTags={activeTags}
        visitedFilter={visitedFilter}
        showPublic={showPublic}
        collapsed={sidebarCollapsed}
        onSearchChange={setSearchQuery}
        onToggleTag={toggleTag}
        onSetVisitedFilter={setVisitedFilter}
        onToggleShowPublic={toggleShowPublic}
        onClearFilters={clearFilters}
        onSelectPlace={handleSelectPlace}
        onCollapsedChange={setSidebarCollapsed}
      />

      {selectedPlace && (
        <PlaceDetailPanel
          key={selectedPlace.id}
          place={selectedPlace}
          onClose={handleCloseDetail}
        />
      )}

      <Map
        ref={mapRef}
        center={WORLD_CENTER}
        zoom={3}
        minZoom={2}
        maxZoom={18}
        className={cn(
          "h-full w-full flex-1",
          pinMode && "cursor-crosshair"
        )}
      >
        <MapClickHandler onClick={handleMapClick} enabled={pinMode} />
        <MapFlyTo target={flyToTarget} />

        <PlaceMarkers
          places={filteredPlaces}
          onSelectPlace={handleSelectPlace}
        />

        <MapControls
          position="bottom-right"
          showZoom
          showLocate
          showFullscreen
        />
      </Map>

      {/* Pin mode banner (mobile) */}
      {pinMode && (
        <div className="fixed inset-x-0 bottom-14 z-controls flex items-center justify-between bg-foreground px-4 py-3 text-background sm:bottom-0 sm:hidden">
          <span className="text-xs font-medium">Tap the map to drop a pin</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPinMode(false)}
            className="text-background hover:text-background/80"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Bottom navigation (mobile only) */}
      <BottomNav onAddClick={handleOpenAddSheet} />

      {/* Unified add-place sheet */}
      <AddPlaceSheet
        open={addSheetOpen}
        onOpenChange={handleAddSheetClose}
        coordinates={clickedCoords}
        onRequestPinMode={handleRequestPinMode}
        prefilledImage={prefilledImage}
      />
    </div>
  )
}
