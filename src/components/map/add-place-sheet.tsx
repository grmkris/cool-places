"use client"

import { useState, useCallback } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { CameraIcon, MapPinIcon } from "lucide-react"
import { useCreatePlace } from "@/hooks/use-create-place"
import { PlaceForm } from "./place-form"

type AddMode = "idle" | "capture" | "pin-waiting" | "form"

const MOCK_CAPTURE_IMAGE = "https://picsum.photos/seed/capture1/800/1000"

export function AddPlaceSheet({
  open,
  onOpenChange,
  coordinates,
  onRequestPinMode,
  prefilledImage,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  coordinates: [number, number] | null
  onRequestPinMode: () => void
  prefilledImage?: string | null
}) {
  const [activeTab, setActiveTab] = useState<string>("capture")
  const [capturedImage, setCapturedImage] = useState<string | null>(
    prefilledImage ?? null
  )
  const [mode, setMode] = useState<AddMode>(
    prefilledImage ? "form" : coordinates ? "form" : "idle"
  )
  const createPlace = useCreatePlace()

  const handleCapture = useCallback(() => {
    // Mock capture — in real app this would use getUserMedia
    setCapturedImage(MOCK_CAPTURE_IMAGE)
    setMode("form")
  }, [])

  const handlePinMode = useCallback(() => {
    onRequestPinMode()
    onOpenChange(false)
  }, [onRequestPinMode, onOpenChange])

  const handleClose = useCallback(() => {
    onOpenChange(false)
    // Reset after close animation
    setTimeout(() => {
      setMode("idle")
      setCapturedImage(null)
      setActiveTab("capture")
    }, 300)
  }, [onOpenChange])

  // When coordinates arrive (from map click), switch to form mode
  const hasCoords = coordinates !== null
  const showForm = mode === "form" || hasCoords

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[85svh] overflow-y-auto rounded-t-2xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}
      >
        {showForm ? (
          /* ── Form mode ── */
          <div className="px-4 pt-4 pb-2">
            <SheetHeader className="p-0 pb-3">
              <SheetTitle className="text-sm">New place</SheetTitle>
              {hasCoords && (
                <p className="text-[11px] text-muted-foreground">
                  At {coordinates[1].toFixed(4)}, {coordinates[0].toFixed(4)}
                </p>
              )}
            </SheetHeader>

            <PlaceForm
              initialValues={
                capturedImage
                  ? { imageUrls: [capturedImage] }
                  : undefined
              }
              submitLabel="Save place"
              pendingLabel="Saving..."
              isPending={createPlace.isPending}
              onSubmit={(values) => {
                createPlace.mutate(
                  {
                    title: values.title,
                    description: values.description || null,
                    latitude: hasCoords ? coordinates[1] : 0,
                    longitude: hasCoords ? coordinates[0] : 0,
                    locationName: values.locationName || null,
                    sourceUrl: values.sourceUrl || null,
                    imageUrls:
                      values.imageUrls.length > 0
                        ? values.imageUrls
                        : undefined,
                    tags:
                      values.tags.length > 0 ? values.tags : undefined,
                    isPublic: values.isPublic,
                  },
                  { onSuccess: () => handleClose() }
                )
              }}
            />
          </div>
        ) : (
          /* ── Capture / Pin picker ── */
          <div className="px-4 pt-4 pb-2">
            <SheetHeader className="p-0 pb-3">
              <SheetTitle className="text-sm">Add a place</SheetTitle>
            </SheetHeader>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="mb-3 h-8 w-full">
                <TabsTrigger value="capture" className="flex-1 gap-1.5 text-[11px]">
                  <CameraIcon size={12} />
                  Capture
                </TabsTrigger>
                <TabsTrigger value="pin" className="flex-1 gap-1.5 text-[11px]">
                  <MapPinIcon size={12} />
                  Pin on map
                </TabsTrigger>
              </TabsList>

              <TabsContent value="capture" className="mt-0">
                {/* Mock camera viewfinder */}
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-neutral-900">
                  <img
                    src={MOCK_CAPTURE_IMAGE}
                    alt="Camera preview"
                    className="h-full w-full object-cover opacity-90"
                  />
                  {/* Vignette */}
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)",
                    }}
                  />
                  {/* Viewfinder corners */}
                  <div className="pointer-events-none absolute inset-3">
                    <div className="absolute top-0 left-0 h-4 w-4 border-t border-l border-white/30" />
                    <div className="absolute top-0 right-0 h-4 w-4 border-t border-r border-white/30" />
                    <div className="absolute bottom-0 left-0 h-4 w-4 border-b border-l border-white/30" />
                    <div className="absolute bottom-0 right-0 h-4 w-4 border-b border-r border-white/30" />
                  </div>
                </div>

                {/* Shutter button */}
                <div className="flex justify-center py-4">
                  <button
                    onClick={handleCapture}
                    className="relative flex h-14 w-14 items-center justify-center rounded-full"
                    aria-label="Take photo"
                  >
                    <div
                      className="absolute inset-0 rounded-full border-[2.5px]"
                      style={{ borderColor: "#c8956c" }}
                    />
                    <div className="h-11 w-11 rounded-full bg-white transition-transform active:scale-90" />
                  </button>
                </div>
              </TabsContent>

              <TabsContent value="pin" className="mt-0">
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                    <MapPinIcon size={24} className="text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Tap the map</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Drop a pin where you want to save a place
                    </p>
                  </div>
                  <Button
                    onClick={handlePinMode}
                    variant="outline"
                    className="gap-2"
                  >
                    <MapPinIcon size={14} />
                    Enter pin mode
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
