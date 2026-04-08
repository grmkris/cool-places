"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { FileUpload } from "@/components/ui/file-upload"
import { XIcon } from "lucide-react"

export interface PlaceFormValues {
  title: string
  description: string
  locationName: string
  sourceUrl: string
  imageUrls: string[]
  tags: string[]
  isPublic: boolean
}

const EMPTY_VALUES: PlaceFormValues = {
  title: "",
  description: "",
  locationName: "",
  sourceUrl: "",
  imageUrls: [],
  tags: [],
  isPublic: false,
}

export function PlaceForm({
  initialValues,
  submitLabel,
  pendingLabel,
  isPending,
  onSubmit,
}: {
  initialValues?: Partial<PlaceFormValues>
  submitLabel: string
  pendingLabel: string
  isPending: boolean
  onSubmit: (values: PlaceFormValues) => void
}) {
  const [title, setTitle] = useState(initialValues?.title ?? EMPTY_VALUES.title)
  const [description, setDescription] = useState(
    initialValues?.description ?? EMPTY_VALUES.description
  )
  const [locationName, setLocationName] = useState(
    initialValues?.locationName ?? EMPTY_VALUES.locationName
  )
  const [sourceUrl, setSourceUrl] = useState(
    initialValues?.sourceUrl ?? EMPTY_VALUES.sourceUrl
  )
  const [imageUrls, setImageUrls] = useState<string[]>(
    initialValues?.imageUrls ?? EMPTY_VALUES.imageUrls
  )
  const [tags, setTags] = useState<string[]>(
    initialValues?.tags ?? EMPTY_VALUES.tags
  )
  const [tagInput, setTagInput] = useState("")
  const [isPublic, setIsPublic] = useState(
    initialValues?.isPublic ?? EMPTY_VALUES.isPublic
  )

  function addTag() {
    const trimmed = tagInput.trim().toLowerCase().replace(/,/g, "")
    if (!trimmed) return
    if (tags.includes(trimmed)) {
      setTagInput("")
      return
    }
    if (tags.length >= 20) return
    setTags((prev) => [...prev, trimmed])
    setTagInput("")
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      locationName: locationName.trim(),
      sourceUrl: sourceUrl.trim(),
      imageUrls,
      tags,
      isPublic,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="place-title">Title</Label>
        <Input
          id="place-title"
          placeholder="Cool sushi spot in Lisbon"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="place-description">Description (optional)</Label>
        <Textarea
          id="place-description"
          placeholder="Why is this place cool?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="place-location">Location name (optional)</Label>
        <Input
          id="place-location"
          placeholder="Lisbon, Portugal"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="place-source">Source link (optional)</Label>
        <Input
          id="place-source"
          type="url"
          placeholder="https://example.com/..."
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="place-tags">Tags</Label>
        <div className="flex gap-1.5">
          <Input
            id="place-tags"
            placeholder="food, view, hike..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault()
                addTag()
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addTag}
            disabled={!tagInput.trim() || tags.length >= 20}
          >
            Add
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge key={tag} variant="outline" className="gap-1 text-[11px]">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <XIcon size={10} />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {imageUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {imageUrls.map((url, i) => (
            <div key={url} className="group relative">
              <img
                src={url}
                alt={`Upload ${i + 1}`}
                loading="lazy"
                className="size-16 rounded-md border object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon-xs"
                onClick={() =>
                  setImageUrls((prev) => prev.filter((_, j) => j !== i))
                }
                className="absolute -top-1.5 -right-1.5 size-5 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
              >
                <XIcon size={10} />
              </Button>
            </div>
          ))}
        </div>
      )}
      {imageUrls.length < 10 && (
        <FileUpload
          onUpload={(url) => setImageUrls((prev) => [...prev, url])}
          disabled={isPending}
        />
      )}

      <label className="flex items-center gap-2 text-xs">
        <Checkbox
          checked={isPublic}
          onCheckedChange={(checked) => setIsPublic(checked === true)}
        />
        <span>Make this place public (other users can see and visit it)</span>
      </label>

      <Button type="submit" disabled={isPending || !title.trim()}>
        {isPending ? pendingLabel : submitLabel}
      </Button>
    </form>
  )
}
