"use client"

import { useMemo, useCallback } from "react"
import {
  useQueryState,
  useQueryStates,
  parseAsString,
  parseAsArrayOf,
  parseAsStringLiteral,
  parseAsBoolean,
} from "nuqs"
import type { CoolPlaceResponse } from "@/server/db/schema/place/place.zod"

const VISITED_FILTERS = ["all", "visited", "unvisited"] as const
export type VisitedFilter = (typeof VISITED_FILTERS)[number]

export interface PlaceFilterState {
  searchQuery: string
  setSearchQuery: (value: string) => void
  activeTags: Set<string>
  toggleTag: (tag: string) => void
  visitedFilter: VisitedFilter
  setVisitedFilter: (value: VisitedFilter) => void
  showPublic: boolean
  toggleShowPublic: () => void
  clearFilters: () => void
}

// State-only hook: reads filter state from URL. Does NOT depend on the
// places list, so it can be called before usePlaces() (which needs
// showPublic to build its query).
export function usePlaceFilterState(): PlaceFilterState {
  const [searchQuery, setSearchQuery] = useQueryState(
    "q",
    parseAsString.withDefault("")
  )

  const [filterParams, setFilterParams] = useQueryStates({
    tags: parseAsArrayOf(parseAsString, ","),
    visited: parseAsStringLiteral(VISITED_FILTERS),
    showPublic: parseAsBoolean,
  })

  const activeTags = useMemo(
    () => new Set(filterParams.tags ?? []),
    [filterParams.tags]
  )

  const visitedFilter: VisitedFilter = filterParams.visited ?? "all"
  const showPublic = filterParams.showPublic ?? false

  const toggleTag = useCallback(
    (tag: string) => {
      const current = filterParams.tags ?? []
      const next = current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag]
      setFilterParams({ tags: next.length === 0 ? null : next })
    },
    [filterParams.tags, setFilterParams]
  )

  const setVisitedFilter = useCallback(
    (value: VisitedFilter) => {
      setFilterParams({ visited: value === "all" ? null : value })
    },
    [setFilterParams]
  )

  const toggleShowPublic = useCallback(() => {
    setFilterParams({ showPublic: showPublic ? null : true })
  }, [showPublic, setFilterParams])

  const clearFilters = useCallback(() => {
    setSearchQuery("")
    setFilterParams({ tags: null, visited: null, showPublic: null })
  }, [setSearchQuery, setFilterParams])

  return {
    searchQuery,
    setSearchQuery,
    activeTags,
    toggleTag,
    visitedFilter,
    setVisitedFilter,
    showPublic,
    toggleShowPublic,
    clearFilters,
  }
}

// Derives allTags + filteredPlaces from the loaded places list + filter state.
// Note: the server already applies search/tag/visited/visibility predicates in
// SQL, so `filteredPlaces` is primarily a client-side safety net — it will
// collapse to a no-op when the server data already matches the URL state.
export function usePlaceFilterResult(
  places: CoolPlaceResponse[],
  state: Pick<PlaceFilterState, "searchQuery" | "activeTags" | "visitedFilter">
) {
  const { searchQuery, activeTags, visitedFilter } = state

  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const p of places) {
      for (const t of p.tags) set.add(t)
    }
    return Array.from(set).sort()
  }, [places])

  const filteredPlaces = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    return places.filter((place) => {
      if (activeTags.size > 0) {
        const hasAnyTag = place.tags.some((t) => activeTags.has(t))
        if (!hasAnyTag) return false
      }
      if (visitedFilter === "visited" && place.visitCount === 0) return false
      if (visitedFilter === "unvisited" && place.visitCount > 0) return false
      if (query) {
        const haystack = [
          place.title,
          place.locationName ?? "",
          place.description ?? "",
        ]
          .join(" ")
          .toLowerCase()
        if (!haystack.includes(query)) return false
      }
      return true
    })
  }, [places, activeTags, visitedFilter, searchQuery])

  return { allTags, filteredPlaces }
}
