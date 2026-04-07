"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { useQueryState } from "nuqs"
import { parseAsCoolPlaceId } from "@/lib/nuqs-parsers"
import { Map, MapControls, useMap } from "@/components/ui/map"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import type { CoolPlaceId } from "@/lib/typeid"
import { usePlaces } from "@/hooks/use-places"
import {
  usePlaceFilterResult,
  usePlaceFilterState,
} from "@/hooks/use-place-filters"
import { useSession } from "@/lib/auth-client"
import { useAppKit } from "@reown/appkit/react"
import { MapPinIcon, WalletIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { CreatePlaceModal } from "./create-place-modal"
import { PlaceDetailPanel } from "./place-detail-panel"
import { PlaceMarkers } from "./place-markers"
import { MapClickHandler } from "./map-click-handler"
import { PlaceSidebar } from "./place-sidebar"
import { UserControls } from "@/components/user-controls"

const WORLD_CENTER: [number, number] = [0, 20]

// Legitimate effect — syncs with external system (MapLibre map)
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

  // Filter state is URL-backed and does NOT depend on the loaded list — it's
  // safe to read before usePlaces().
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

  // Push filter state through to the server so the SQL WHERE clause does the
  // work. The client-side filter that follows is just a safety net.
  const listInput = useMemo(
    () => ({
      includePublic: showPublic,
      search: searchQuery || undefined,
      tags: activeTags.size > 0 ? Array.from(activeTags) : undefined,
      visitedFilter,
    }),
    [showPublic, searchQuery, activeTags, visitedFilter]
  )

  // Gate the fetch on auth — otherwise the oRPC call 401s and the error
  // toast fires on every unauthenticated page load.
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

  const [addMode, setAddMode] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [clickedCoords, setClickedCoords] = useState<[number, number] | null>(
    null
  )
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

  function handleMapClick(lng: number, lat: number) {
    if (!addMode) return
    setClickedCoords([lng, lat])
    setCreateModalOpen(true)
    setAddMode(false)
  }

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

  const fabRight = selectedPlace ? "right-2 sm:right-[21.5rem]" : "right-2"

  // Unauth hero — shown before the session has resolved only when clearly
  // not signed in. Keeps the 401 toast from firing on first paint.
  if (!sessionPending && !isSignedIn) {
    return (
      <div className="flex h-svh w-svw flex-col items-center justify-center gap-4 bg-background px-6">
        <MapPinIcon size={32} className="text-muted-foreground" />
        <div className="text-center">
          <h1 className="text-lg font-semibold">Cool Places</h1>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            Connect your wallet to start saving cool places you want to visit.
          </p>
        </div>
        <Button onClick={() => openAppKit()}>
          <WalletIcon size={14} />
          Connect wallet
        </Button>
      </div>
    )
  }

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

  return (
    <div className="relative flex h-svh w-svw flex-col">
      <div className="absolute top-2 right-2 z-[1001]">
        <UserControls />
      </div>
      <Map
        center={WORLD_CENTER}
        zoom={3}
        minZoom={2}
        maxZoom={18}
        className={cn(
          "h-full w-full flex-1",
          addMode && "cursor-crosshair"
        )}
      >
        <MapClickHandler onClick={handleMapClick} enabled={addMode} />
        <MapFlyTo target={flyToTarget} />

        <PlaceMarkers
          places={filteredPlaces}
          onSelectPlace={handleSelectPlace}
        />

        {selectedPlace && (
          <PlaceDetailPanel
            key={selectedPlace.id}
            place={selectedPlace}
            onClose={handleCloseDetail}
          />
        )}

        <MapControls
          position="bottom-right"
          showZoom
          showLocate
          showFullscreen
        />

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
      </Map>

      {/* Add place mode FAB — sibling overlay (mapcn has no control container primitive) */}
      <div className={cn("absolute z-[1001] bottom-44", fabRight)}>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="icon"
                variant={addMode ? "default" : "outline"}
                onClick={() => setAddMode((p) => !p)}
                aria-label={addMode ? "Cancel add" : "Add place"}
                className={cn(
                  addMode && "ring-2 ring-primary/50 animate-pulse"
                )}
              />
            }
          >
            <MapPinIcon size={18} />
          </TooltipTrigger>
          <TooltipContent side="left">
            {addMode ? "Cancel add" : "Add place"}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Add mode mobile banner */}
      {addMode && (
        <div className="fixed inset-x-0 bottom-0 z-[1001] flex items-center justify-between bg-foreground px-4 py-3 text-background sm:hidden">
          <span className="text-xs font-medium">Tap map to drop pin</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAddMode(false)}
            className="text-background hover:text-background/80"
          >
            Cancel
          </Button>
        </div>
      )}

      <CreatePlaceModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        coordinates={clickedCoords}
      />
    </div>
  )
}
