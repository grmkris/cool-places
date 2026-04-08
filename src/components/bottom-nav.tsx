"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { MapIcon, CameraIcon, PlusIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomNav({
  onAddClick,
}: {
  onAddClick?: () => void
}) {
  const pathname = usePathname()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-controls flex items-center justify-around border-t border-border/30 bg-background/80 backdrop-blur-xl sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <Link
        href="/"
        className={cn(
          "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors",
          pathname === "/"
            ? "text-foreground"
            : "text-muted-foreground"
        )}
      >
        <MapIcon size={20} />
        <span>Map</span>
      </Link>

      <button
        onClick={onAddClick}
        className="flex flex-col items-center gap-0.5 px-6 py-2.5 text-[10px] text-muted-foreground transition-colors active:text-foreground"
      >
        <div className="flex size-8 items-center justify-center rounded-full text-white" style={{ backgroundColor: "#c8956c" }}>
          <PlusIcon size={18} strokeWidth={2.5} />
        </div>
      </button>

      <Link
        href="/capture"
        className={cn(
          "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors",
          pathname === "/capture"
            ? "text-foreground"
            : "text-muted-foreground"
        )}
      >
        <CameraIcon size={20} />
        <span>Capture</span>
      </Link>
    </nav>
  )
}
