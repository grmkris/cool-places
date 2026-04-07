"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useCreatePlace } from "@/hooks/use-create-place"
import { PlaceForm } from "./place-form"

export function CreatePlaceModal({
  open,
  onOpenChange,
  coordinates,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  coordinates: [number, number] | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {coordinates && (
          <CreatePlaceFormInner
            key={`${coordinates[0]},${coordinates[1]}`}
            coordinates={coordinates}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function CreatePlaceFormInner({
  coordinates,
  onOpenChange,
}: {
  coordinates: [number, number]
  onOpenChange: (open: boolean) => void
}) {
  const createPlace = useCreatePlace()

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add a place</DialogTitle>
        <DialogDescription>
          At {coordinates[1].toFixed(4)}, {coordinates[0].toFixed(4)}
        </DialogDescription>
      </DialogHeader>
      <PlaceForm
        submitLabel="Save place"
        pendingLabel="Saving..."
        isPending={createPlace.isPending}
        onSubmit={(values) => {
          createPlace.mutate(
            {
              title: values.title,
              description: values.description || null,
              latitude: coordinates[1],
              longitude: coordinates[0],
              locationName: values.locationName || null,
              sourceUrl: values.sourceUrl || null,
              imageUrls:
                values.imageUrls.length > 0 ? values.imageUrls : undefined,
              tags: values.tags.length > 0 ? values.tags : undefined,
              isPublic: values.isPublic,
            },
            { onSuccess: () => onOpenChange(false) }
          )
        }}
      />
    </>
  )
}
