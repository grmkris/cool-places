"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useUpdatePlace } from "@/hooks/use-update-place"
import type { CoolPlaceResponse } from "@/server/db/schema/place/place.zod"
import { PlaceForm } from "./place-form"

export function EditPlaceModal({
  open,
  onOpenChange,
  place,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  place: CoolPlaceResponse
}) {
  const updatePlace = useUpdatePlace()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit place</DialogTitle>
          <DialogDescription>
            At {place.coordinates[1].toFixed(4)},{" "}
            {place.coordinates[0].toFixed(4)}
          </DialogDescription>
        </DialogHeader>
        <PlaceForm
          key={place.id}
          initialValues={{
            title: place.title,
            description: place.description ?? "",
            locationName: place.locationName ?? "",
            sourceUrl: place.sourceUrl ?? "",
            imageUrls: place.imageUrls,
            tags: place.tags,
            isPublic: place.isPublic,
          }}
          submitLabel="Update place"
          pendingLabel="Updating..."
          isPending={updatePlace.isPending}
          onSubmit={(values) => {
            updatePlace.mutate(
              {
                id: place.id,
                title: values.title,
                description: values.description || null,
                locationName: values.locationName || null,
                sourceUrl: values.sourceUrl || null,
                imageUrls: values.imageUrls,
                tags: values.tags,
                isPublic: values.isPublic,
              },
              { onSuccess: () => onOpenChange(false) }
            )
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
