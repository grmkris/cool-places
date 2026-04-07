import { Suspense } from "react"
import { PlaceMap } from "@/components/map/place-map"
import { ErrorBoundary } from "@/components/error-boundary"
import { Spinner } from "@/components/ui/spinner"

export default function Page() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="flex h-svh w-svw flex-col items-center justify-center gap-3 bg-background">
            <Spinner className="size-5" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Loading
            </span>
          </div>
        }
      >
        <PlaceMap />
      </Suspense>
    </ErrorBoundary>
  )
}
