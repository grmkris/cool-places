"use client"

import { useState, useRef, useCallback, useEffect } from "react"

export type CameraStatus = "idle" | "requesting" | "active" | "denied" | "error"

interface UseCameraOptions {
  facingMode?: "user" | "environment"
  width?: number
  height?: number
}

export function useCamera(options?: UseCameraOptions) {
  const {
    facingMode: initialFacingMode = "environment",
    width = 1280,
    height = 1920,
  } = options ?? {}

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState<CameraStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState(initialFacingMode)

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setStatus("idle")
  }, [])

  const start = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setStatus("error")
      setError("Camera not available in this browser")
      return
    }

    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }

    setStatus("requesting")
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: width },
          height: { ideal: height },
        },
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      setStatus("active")
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setStatus("denied")
        setError("Camera access denied")
      } else if (err instanceof DOMException && err.name === "NotFoundError") {
        setStatus("error")
        setError("No camera found on this device")
      } else {
        setStatus("error")
        setError(err instanceof Error ? err.message : "Failed to access camera")
      }
    }
  }, [facingMode, width, height])

  const switchCamera = useCallback(async () => {
    const next = facingMode === "environment" ? "user" : "environment"
    setFacingMode(next)
    // Will restart with new facingMode on next start() call
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices) return

    setStatus("requesting")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: next },
          width: { ideal: width },
          height: { ideal: height },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setStatus("active")
    } catch (err) {
      setStatus("error")
      setError(err instanceof Error ? err.message : "Failed to switch camera")
    }
  }, [facingMode, width, height])

  const captureFrame = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current
    if (!video || video.readyState < 2) return null

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    ctx.drawImage(video, 0, 0)

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        "image/jpeg",
        0.85,
      )
    })
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [])

  return {
    videoRef,
    status,
    error,
    start,
    stop,
    captureFrame,
    switchCamera,
  }
}
