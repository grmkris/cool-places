"use client"

import { MapControlContainer } from "@/components/ui/map"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import type { CoolPlaceResponse } from "@/server/db/schema/place/place.zod"
import type { CoolPlaceId } from "@/lib/typeid"
import type { VisitedFilter } from "@/hooks/use-place-filters"
import { useMyRecentVisits } from "@/hooks/use-my-recent-visits"
import { cn } from "@/lib/utils"
import {
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  EyeIcon,
  MapPinIcon,
  SearchIcon,
} from "lucide-react"

function PlaceListItem({
  place,
  index,
  isSelected,
  onSelect,
  onCollapseMobile,
}: {
  place: CoolPlaceResponse
  index: number
  isSelected: boolean
  onSelect: (id: CoolPlaceId) => void
  onCollapseMobile: () => void
}) {
  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-left-1 cursor-pointer border-b border-l-2 border-border/50 px-3 py-2.5 transition-colors hover:bg-muted/50",
        place.visitCount > 0
          ? "border-l-emerald-500"
          : place.isPublic
            ? "border-l-violet-500"
            : "border-l-rose-500",
        isSelected && "bg-muted/70"
      )}
      style={{
        animationDelay: `${index * 30}ms`,
        animationFillMode: "backwards",
      }}
      onClick={() => {
        onSelect(place.id)
        onCollapseMobile()
      }}
    >
      <div className="mb-1 flex items-center gap-1.5">
        {place.visitCount > 0 ? (
          <CheckCircle2Icon size={11} className="text-emerald-500" />
        ) : (
          <MapPinIcon size={11} className="text-muted-foreground" />
        )}
        {place.isPublic && (
          <EyeIcon size={10} className="text-violet-500" />
        )}
        {place.locationName && (
          <span className="truncate text-[10px] text-muted-foreground">
            {place.locationName}
          </span>
        )}
      </div>
      <div className="text-xs font-medium leading-tight">{place.title}</div>
      {place.tags.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {place.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="outline" className="px-1 text-[9px]">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

function RecentVisitsTab({
  onSelectPlace,
  onCollapseMobile,
}: {
  onSelectPlace: (id: CoolPlaceId) => void
  onCollapseMobile: () => void
}) {
  const { data: visits = [], isLoading } = useMyRecentVisits(50)

  if (isLoading) {
    return (
      <div className="px-4 py-6 text-center text-[11px] text-muted-foreground">
        Loading...
      </div>
    )
  }

  if (visits.length === 0) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-[11px] text-muted-foreground">No visits yet</p>
        <p className="mt-1 text-[10px] text-muted-foreground/60">
          Mark a place as visited to see it here
        </p>
      </div>
    )
  }

  return (
    <div>
      {visits.map((visit, index) => {
        const date = new Date(visit.visitedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
        return (
          <div
            key={visit.id}
            className="animate-in fade-in slide-in-from-left-1 cursor-pointer border-b border-l-2 border-l-emerald-500 border-border/50 px-3 py-2.5 transition-colors hover:bg-muted/50"
            style={{
              animationDelay: `${index * 30}ms`,
              animationFillMode: "backwards",
            }}
            onClick={() => {
              onSelectPlace(visit.placeId)
              onCollapseMobile()
            }}
          >
            <div className="mb-1 flex items-center gap-1.5">
              <ClockIcon size={11} className="text-emerald-500" />
              <span className="text-[10px] text-muted-foreground">{date}</span>
            </div>
            <div className="text-xs font-medium leading-tight">
              {visit.placeTitle}
            </div>
            {visit.notes && (
              <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">
                {visit.notes}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function PlaceSidebar({
  filteredPlaces,
  selectedPlaceId,
  searchQuery,
  allTags,
  activeTags,
  visitedFilter,
  showPublic,
  collapsed,
  onSearchChange,
  onToggleTag,
  onSetVisitedFilter,
  onToggleShowPublic,
  onClearFilters,
  onSelectPlace,
  onCollapsedChange,
}: {
  filteredPlaces: CoolPlaceResponse[]
  selectedPlaceId: CoolPlaceId | null
  searchQuery: string
  allTags: string[]
  activeTags: Set<string>
  visitedFilter: VisitedFilter
  showPublic: boolean
  collapsed: boolean
  onSearchChange: (query: string) => void
  onToggleTag: (tag: string) => void
  onSetVisitedFilter: (filter: VisitedFilter) => void
  onToggleShowPublic: () => void
  onClearFilters: () => void
  onSelectPlace: (id: CoolPlaceId) => void
  onCollapsedChange: (collapsed: boolean) => void
}) {
  const hasActiveFilters =
    searchQuery.length > 0 ||
    activeTags.size > 0 ||
    visitedFilter !== "all" ||
    showPublic

  const collapseMobile = () => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      onCollapsedChange(true)
    }
  }

  return (
    <MapControlContainer className="absolute top-0 left-0 z-[999] h-full">
      {collapsed ? (
        <button
          onClick={() => onCollapsedChange(false)}
          className="m-2 inline-flex size-8 items-center justify-center rounded-md border bg-background/90 backdrop-blur-md hover:bg-muted/50"
          aria-label="Expand sidebar"
        >
          <ChevronRightIcon size={14} />
        </button>
      ) : (
        <div className="flex h-full w-80 flex-col border-r bg-background/90 backdrop-blur-md dark:border-white/[0.06]">
          {/* Header */}
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <h1 className="flex-1 text-sm font-semibold">Cool Places</h1>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    onClick={() => onCollapsedChange(true)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  />
                }
              >
                <ChevronLeftIcon size={14} />
              </TooltipTrigger>
              <TooltipContent>Collapse</TooltipContent>
            </Tooltip>
          </div>

          <Tabs
            defaultValue="places"
            className="flex min-h-0 flex-1 flex-col gap-0"
          >
            <TabsList className="mx-3 mt-2 h-7 w-auto">
              <TabsTrigger value="places" className="flex-1 text-[10px]">
                Places
              </TabsTrigger>
              <TabsTrigger value="visits" className="flex-1 text-[10px]">
                Recent visits
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="places"
              className="flex min-h-0 flex-1 flex-col"
            >
              {/* Filters */}
              <div className="space-y-2 border-b px-3 py-2">
                <div className="relative">
                  <SearchIcon
                    size={12}
                    className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search title or location..."
                    className="h-8 pl-7 text-xs"
                  />
                </div>

                <Tabs
                  value={visitedFilter}
                  onValueChange={(v) => onSetVisitedFilter(v as VisitedFilter)}
                >
                  <TabsList className="h-7 w-full">
                    <TabsTrigger value="all" className="flex-1 text-[10px]">
                      All
                    </TabsTrigger>
                    <TabsTrigger
                      value="unvisited"
                      className="flex-1 text-[10px]"
                    >
                      To visit
                    </TabsTrigger>
                    <TabsTrigger
                      value="visited"
                      className="flex-1 text-[10px]"
                    >
                      Visited
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <label className="flex items-center gap-1.5 text-[11px]">
                  <input
                    type="checkbox"
                    checked={showPublic}
                    onChange={onToggleShowPublic}
                    className="size-3.5"
                  />
                  <span>Include public places from others</span>
                </label>

                {allTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {allTags.map((tag) => {
                      const isActive = activeTags.has(tag)
                      return (
                        <button
                          key={tag}
                          onClick={() => onToggleTag(tag)}
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] transition-colors",
                            isActive
                              ? "border-foreground/30 bg-foreground/10 text-foreground"
                              : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                          )}
                        >
                          {tag}
                        </button>
                      )
                    })}
                  </div>
                )}

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-full text-[10px]"
                    onClick={onClearFilters}
                  >
                    Clear filters
                  </Button>
                )}
              </div>

              {/* Place list */}
              <ScrollArea className="flex-1">
                {filteredPlaces.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-[11px] text-muted-foreground">
                      No places yet
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground/60">
                      Click the pin icon and tap the map to add one
                    </p>
                  </div>
                ) : (
                  filteredPlaces.map((place, index) => (
                    <PlaceListItem
                      key={place.id}
                      place={place}
                      index={index}
                      isSelected={selectedPlaceId === place.id}
                      onSelect={onSelectPlace}
                      onCollapseMobile={collapseMobile}
                    />
                  ))
                )}
              </ScrollArea>

              {/* Count footer */}
              <div className="border-t px-3 py-1.5 text-[10px] text-muted-foreground">
                {filteredPlaces.length} place
                {filteredPlaces.length !== 1 ? "s" : ""}
              </div>
            </TabsContent>

            <TabsContent
              value="visits"
              className="flex min-h-0 flex-1 flex-col"
            >
              <ScrollArea className="flex-1">
                <RecentVisitsTab
                  onSelectPlace={onSelectPlace}
                  onCollapseMobile={collapseMobile}
                />
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </MapControlContainer>
  )
}
