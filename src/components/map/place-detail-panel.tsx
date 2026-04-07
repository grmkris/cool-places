"use client"

import { useState } from "react"
import { MapControlContainer } from "@/components/ui/map"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { useSession } from "@/lib/auth-client"
import { useAppKit } from "@reown/appkit/react"
import { usePlaceVisits } from "@/hooks/use-place-visits"
import { useCreateVisit } from "@/hooks/use-create-visit"
import { useDeleteVisit } from "@/hooks/use-delete-visit"
import { useDeletePlace } from "@/hooks/use-delete-place"
import { useSetPublic } from "@/hooks/use-set-public"
import type { CoolPlaceResponse } from "@/server/db/schema/place/place.zod"
import type { PlaceVisitId } from "@/lib/typeid"
import { toast } from "sonner"
import {
  CheckCircle2Icon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  PencilIcon,
  PlusIcon,
  Share2Icon,
  Trash2Icon,
  WalletIcon,
  XIcon,
} from "lucide-react"
import { EditPlaceModal } from "./edit-place-modal"

export function PlaceDetailPanel({
  place,
  onClose,
}: {
  place: CoolPlaceResponse
  onClose: () => void
}) {
  const { data: sessionData } = useSession()
  const isSignedIn = !!sessionData?.session
  const { open: openAppKit } = useAppKit()
  const visits = usePlaceVisits(place.id)
  const createVisit = useCreateVisit()
  const deleteVisit = useDeleteVisit()
  const deletePlace = useDeletePlace()
  const setPublic = useSetPublic()

  const [showVisitForm, setShowVisitForm] = useState(false)
  const [visitNotes, setVisitNotes] = useState("")
  const [visitDate, setVisitDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [editOpen, setEditOpen] = useState(false)

  function handleShare() {
    if (typeof window === "undefined") return
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => toast.success("Link copied"))
      .catch(() => toast.error("Failed to copy link"))
  }

  function handleAddVisit() {
    createVisit.mutate(
      {
        placeId: place.id,
        visitedAt: new Date(visitDate).toISOString(),
        notes: visitNotes.trim() || null,
      },
      {
        onSuccess: () => {
          setShowVisitForm(false)
          setVisitNotes("")
          setVisitDate(new Date().toISOString().slice(0, 10))
        },
      }
    )
  }

  function handleQuickVisit() {
    createVisit.mutate({
      placeId: place.id,
      visitedAt: new Date().toISOString(),
    })
  }

  function handleDeletePlace() {
    if (!confirm("Delete this place? This cannot be undone.")) return
    deletePlace.mutate(place.id, {
      onSuccess: () => onClose(),
    })
  }

  function handleTogglePublic() {
    setPublic.mutate({ id: place.id, isPublic: !place.isPublic })
  }

  function handleDeleteVisit(id: PlaceVisitId) {
    deleteVisit.mutate(id)
  }

  const visitList = visits.data ?? []
  const created = new Date(place.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return (
    <MapControlContainer className="absolute top-0 right-0 z-[1000] h-full w-[calc(100vw-3rem)] sm:w-80">
      <div className="flex h-full max-h-full w-full flex-col border-l bg-background/90 backdrop-blur-md dark:border-white/[0.06]">
        {/* Header */}
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            {place.visitCount > 0 && (
              <Badge
                variant="outline"
                className="shrink-0 gap-0.5 border-emerald-500/20 bg-emerald-500/10 text-[10px] text-emerald-500"
              >
                <CheckCircle2Icon size={10} />
                Visited
              </Badge>
            )}
            <Badge
              variant="outline"
              className="shrink-0 text-[10px]"
              title={place.isPublic ? "Public" : "Private"}
            >
              {place.isPublic ? (
                <>
                  <EyeIcon size={10} /> Public
                </>
              ) : (
                <>
                  <EyeOffIcon size={10} /> Private
                </>
              )}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            className="shrink-0"
            aria-label="Share link"
            onClick={handleShare}
          >
            <Share2Icon size={13} />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            className="shrink-0"
            aria-label="Close panel"
            onClick={onClose}
          >
            <XIcon size={14} />
          </Button>
        </div>

        <ScrollArea className="flex-1 overflow-hidden">
          <div className="space-y-3 px-3 py-3">
            {place.imageUrls.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {place.imageUrls.map((url) => (
                  <img
                    key={url}
                    src={url}
                    alt={place.title}
                    className="h-32 w-auto shrink-0 rounded-md object-cover"
                  />
                ))}
              </div>
            )}

            <h3 className="text-sm font-semibold leading-tight">
              {place.title}
            </h3>

            {place.description && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {place.description}
              </p>
            )}

            {place.locationName && (
              <div className="text-[11px] text-muted-foreground">
                {place.locationName}
              </div>
            )}

            {place.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {place.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-[10px]"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {place.sourceUrl && (
              <a
                href={place.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-violet-500 hover:underline"
              >
                Source
                <ExternalLinkIcon size={10} />
              </a>
            )}

            <div className="text-[10px] text-muted-foreground/60">
              by {place.creatorName} · {created}
            </div>

            <Separator />

            {/* Visit log */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Visits ({visitList.length})
                </h4>
                {isSignedIn && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px]"
                      onClick={handleQuickVisit}
                      disabled={createVisit.isPending}
                    >
                      <CheckCircle2Icon size={11} />
                      Visited now
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="outline"
                      onClick={() => setShowVisitForm((p) => !p)}
                    >
                      <PlusIcon size={11} />
                    </Button>
                  </div>
                )}
              </div>

              {showVisitForm && (
                <div className="mb-2 space-y-2 rounded-md border p-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground">
                      Date
                    </label>
                    <input
                      type="date"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      className="mt-0.5 h-7 w-full rounded-md border bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <Textarea
                    placeholder="Notes (optional)"
                    value={visitNotes}
                    onChange={(e) => setVisitNotes(e.target.value)}
                    rows={2}
                    className="text-xs"
                  />
                  <Button
                    size="sm"
                    className="h-7 w-full text-[10px]"
                    onClick={handleAddVisit}
                    disabled={createVisit.isPending}
                  >
                    Save visit
                  </Button>
                </div>
              )}

              {visitList.length === 0 ? (
                <p className="text-[11px] text-muted-foreground/60">
                  No visits yet.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {visitList.map((visit) => {
                    const date = new Date(visit.visitedAt).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric", year: "numeric" }
                    )
                    return (
                      <li
                        key={visit.id}
                        className="group flex items-start gap-2 rounded-md border px-2 py-1.5"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-medium">{date}</div>
                          {visit.notes && (
                            <p className="text-[10px] text-muted-foreground">
                              {visit.notes}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteVisit(visit.id)}
                          className="shrink-0 text-muted-foreground/40 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                        >
                          <Trash2Icon size={10} />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Owner actions */}
            {place.isOwner && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-full text-[11px]"
                    onClick={() => setEditOpen(true)}
                  >
                    <PencilIcon size={11} />
                    Edit place
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-full text-[11px]"
                    onClick={handleTogglePublic}
                    disabled={setPublic.isPending}
                  >
                    {place.isPublic ? (
                      <>
                        <EyeOffIcon size={11} /> Make private
                      </>
                    ) : (
                      <>
                        <EyeIcon size={11} /> Make public
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-full text-[11px] text-red-500 hover:text-red-600"
                    onClick={handleDeletePlace}
                    disabled={deletePlace.isPending}
                  >
                    <Trash2Icon size={11} />
                    Delete place
                  </Button>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {!isSignedIn && (
          <button
            onClick={() => openAppKit()}
            className="flex w-full items-center gap-2 border-t px-3 py-3 text-left transition-colors hover:bg-muted/50"
          >
            <WalletIcon size={14} className="text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Connect wallet to track visits
            </p>
          </button>
        )}
      </div>

      {place.isOwner && (
        <EditPlaceModal
          open={editOpen}
          onOpenChange={setEditOpen}
          place={place}
        />
      )}
    </MapControlContainer>
  )
}
