"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeftIcon,
  RefreshCwIcon,
  ZapIcon,
  SwitchCameraIcon,
  CheckIcon,
} from "lucide-react"
import { toast } from "sonner"
import { StampCard } from "./stamp-card"
import "./capture.css"

type CaptureState = "idle" | "capturing" | "result"

const MOCK_PREVIEW = "https://picsum.photos/seed/tallinn42/800/1200"
const MOCK_PREVIOUS = [
  "https://picsum.photos/seed/stamp1/400/500",
  "https://picsum.photos/seed/stamp2/400/500",
  "https://picsum.photos/seed/stamp3/400/500",
  "https://picsum.photos/seed/stamp4/400/500",
]

export function CaptureFlow({
  serifFont,
  monoFont,
}: {
  serifFont: string
  monoFont: string
}) {
  const router = useRouter()
  const [state, setState] = useState<CaptureState>("idle")
  const [showFlash, setShowFlash] = useState(false)

  const handleCapture = useCallback(() => {
    if (state !== "idle") return
    setState("capturing")
    setShowFlash(true)

    setTimeout(() => setShowFlash(false), 250)
    setTimeout(() => setState("result"), 400)
  }, [state])

  const handleRetake = useCallback(() => {
    setState("idle")
  }, [])

  const handleUse = useCallback(() => {
    // Navigate back to map with add-place sheet pre-opened and image pre-filled
    router.push(`/?addPlace=true&image=${encodeURIComponent(MOCK_PREVIEW)}`)
  }, [router])

  const handleBack = useCallback(() => {
    router.push("/")
  }, [router])

  return (
    <div className="relative flex h-svh w-svw flex-col overflow-hidden bg-[#0a0a0a]">
      {/* Film grain overlay */}
      <div className="film-grain">
        <svg>
          <filter id="grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.75"
              numOctaves="4"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </div>

      <AnimatePresence mode="wait">
        {(state === "idle" || state === "capturing") && (
          <motion.div
            key="camera"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-1 flex-col"
            style={{
              paddingTop: "env(safe-area-inset-top, 0px)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 py-3">
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 rounded-full p-2 text-white/50 transition-colors hover:text-white/80"
                aria-label="Back to map"
              >
                <ArrowLeftIcon size={16} />
              </button>
              <span className={`${monoFont} text-[10px] tracking-widest text-white/40`}>
                {new Date().toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </span>
              <button className="rounded-full p-2 text-white/50 transition-colors hover:text-white/80">
                <ZapIcon size={16} />
              </button>
            </div>

            {/* Camera preview */}
            <div className="relative mx-3 flex-1 overflow-hidden rounded-2xl">
              <img
                src={MOCK_PREVIEW}
                alt="Camera preview"
                className="h-full w-full object-cover"
              />
              {/* Vignette */}
              <div className="vignette pointer-events-none absolute inset-0" />

              {/* Shutter flash */}
              {showFlash && (
                <div className="shutter-flash pointer-events-none absolute inset-0 bg-white" />
              )}

              {/* Viewfinder corners */}
              <div className="pointer-events-none absolute inset-4">
                <div className="absolute top-0 left-0 h-5 w-5 border-t border-l border-white/25 rounded-tl-sm" />
                <div className="absolute top-0 right-0 h-5 w-5 border-t border-r border-white/25 rounded-tr-sm" />
                <div className="absolute bottom-0 left-0 h-5 w-5 border-b border-l border-white/25 rounded-bl-sm" />
                <div className="absolute bottom-0 right-0 h-5 w-5 border-b border-r border-white/25 rounded-br-sm" />
              </div>
            </div>

            {/* Bottom capture bar */}
            <div className="flex items-center justify-between px-8 py-5">
              {/* Last capture thumbnail */}
              <div className="h-10 w-10 overflow-hidden rounded-lg border border-white/10 shadow-lg">
                <img
                  src={MOCK_PREVIOUS[0]}
                  alt="Previous"
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Shutter button */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleCapture}
                className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full"
                aria-label="Capture photo"
              >
                {/* Outer ring */}
                <div
                  className="absolute inset-0 rounded-full border-[3px]"
                  style={{ borderColor: "#c8956c" }}
                />
                {/* Inner circle */}
                <div className="h-[58px] w-[58px] rounded-full bg-white transition-transform" />
              </motion.button>

              {/* Camera flip */}
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/50 transition-colors hover:text-white/80"
                aria-label="Switch camera"
              >
                <SwitchCameraIcon size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {state === "result" && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="result-grid flex flex-1 flex-col items-center justify-center"
            style={{
              paddingTop: "env(safe-area-inset-top, 0px)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
              background:
                "radial-gradient(ellipse at 50% 30%, #1a1611 0%, #0a0a0a 70%)",
            }}
          >
            {/* Stamp card */}
            <div className="flex-1 flex items-center justify-center px-6">
              <StampCard
                imageSrc={MOCK_PREVIEW}
                serifFont={serifFont}
                monoFont={monoFont}
              />
            </div>

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.65 }}
              className="flex w-full max-w-xs gap-3 px-6 pb-3"
            >
              <button
                onClick={handleRetake}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-[13px] font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white/80"
              >
                <RefreshCwIcon size={14} />
                Retake
              </button>
              <button
                onClick={handleUse}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-medium text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: "#c8956c" }}
              >
                <CheckIcon size={14} />
                Use Photo
              </button>
            </motion.div>

            {/* Previous stamps carousel */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.8 }}
              className="flex w-full gap-2 overflow-x-auto px-6 pb-6 pt-2"
            >
              {MOCK_PREVIOUS.map((src, i) => (
                <div
                  key={i}
                  className="stamp-edge h-16 w-12 shrink-0 overflow-hidden rounded-sm p-[3px]"
                  style={{ opacity: 0.6 + i * 0.05 }}
                >
                  <img
                    src={src}
                    alt={`Previous stamp ${i + 1}`}
                    className="h-full w-full rounded-[2px] object-cover"
                  />
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
