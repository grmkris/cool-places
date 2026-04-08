"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeftIcon,
  RefreshCwIcon,
  ZapIcon,
  SwitchCameraIcon,
  CheckIcon,
  CameraOffIcon,
  LoaderIcon,
} from "lucide-react"
import { useCameraUpload } from "@/hooks/use-camera-upload"
import { StampCard } from "./stamp-card"
import "./capture.css"

type CaptureState = "idle" | "capturing" | "result"

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
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null)

  const {
    videoRef,
    status: cameraStatus,
    error: cameraError,
    start: startCamera,
    stop: stopCamera,
    captureAndUpload,
    isUploading,
    switchCamera,
  } = useCameraUpload({ width: 800, height: 1200 })

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCapture = useCallback(async () => {
    if (state !== "idle" || isUploading) return
    setState("capturing")
    setShowFlash(true)

    setTimeout(() => setShowFlash(false), 250)

    const url = await captureAndUpload()
    if (url) {
      setCapturedImageUrl(url)
      stopCamera()
      setState("result")
    } else {
      setState("idle")
    }
  }, [state, isUploading, captureAndUpload, stopCamera])

  const handleRetake = useCallback(() => {
    setCapturedImageUrl(null)
    setState("idle")
    startCamera()
  }, [startCamera])

  const handleUse = useCallback(() => {
    if (!capturedImageUrl) return
    router.push(`/?addPlace=true&image=${encodeURIComponent(capturedImageUrl)}`)
  }, [router, capturedImageUrl])

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
            <div className="relative mx-3 flex-1 overflow-hidden rounded-2xl bg-neutral-900">
              {cameraStatus === "active" && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
              )}

              {cameraStatus === "requesting" && (
                <div className="flex h-full w-full items-center justify-center">
                  <LoaderIcon size={24} className="animate-spin text-white/40" />
                </div>
              )}

              {(cameraStatus === "denied" || cameraStatus === "error") && (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6">
                  <CameraOffIcon size={32} className="text-white/30" />
                  <p className="text-center text-sm text-white/50">
                    {cameraError ?? "Camera unavailable"}
                  </p>
                  <button
                    onClick={() => startCamera()}
                    className="rounded-lg border border-white/10 px-4 py-2 text-xs text-white/60 transition-colors hover:border-white/20 hover:text-white/80"
                  >
                    Try again
                  </button>
                </div>
              )}

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
                disabled={cameraStatus !== "active" || isUploading}
                className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full disabled:opacity-40"
                aria-label="Capture photo"
              >
                {isUploading ? (
                  <LoaderIcon size={24} className="animate-spin text-white/60" />
                ) : (
                  <>
                    {/* Outer ring */}
                    <div
                      className="absolute inset-0 rounded-full border-[3px]"
                      style={{ borderColor: "#c8956c" }}
                    />
                    {/* Inner circle */}
                    <div className="h-[58px] w-[58px] rounded-full bg-white transition-transform" />
                  </>
                )}
              </motion.button>

              {/* Camera flip */}
              <button
                onClick={switchCamera}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/50 transition-colors hover:text-white/80"
                aria-label="Switch camera"
              >
                <SwitchCameraIcon size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {state === "result" && capturedImageUrl && (
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
                imageSrc={capturedImageUrl}
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
