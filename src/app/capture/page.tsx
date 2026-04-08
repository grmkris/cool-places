import type { Metadata } from "next"
import { Instrument_Serif, DM_Mono } from "next/font/google"
import { CaptureFlow } from "./capture-flow"

export const metadata: Metadata = {
  title: "Capture | Cool Places",
  description: "Capture a moment and turn it into a collectible stamp",
}

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument",
})

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-mono",
})

export default function CapturePage() {
  return (
    <div className={`${instrumentSerif.variable} ${dmMono.variable}`}>
      <CaptureFlow
        serifFont="font-[family-name:var(--font-instrument)]"
        monoFont="font-[family-name:var(--font-dm-mono)]"
      />
    </div>
  )
}
