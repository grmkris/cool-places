"use client"

import { useCallback } from "react"
import { useCamera, type CameraStatus } from "./use-camera"
import { useFileUpload } from "./use-file-upload"

interface UseCameraUploadOptions {
  facingMode?: "user" | "environment"
  width?: number
  height?: number
}

export function useCameraUpload(options?: UseCameraUploadOptions) {
  const camera = useCamera(options)
  const { uploadFile, isUploading } = useFileUpload()

  const captureAndUpload = useCallback(async (): Promise<string | null> => {
    const blob = await camera.captureFrame()
    if (!blob) return null

    const file = new File([blob], `capture-${Date.now()}.jpg`, {
      type: "image/jpeg",
    })
    const result = await uploadFile(file)
    return result?.url ?? null
  }, [camera.captureFrame, uploadFile])

  return {
    ...camera,
    captureAndUpload,
    isUploading,
  }
}
