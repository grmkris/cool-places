"use client"

import { motion } from "framer-motion"

const spring = { type: "spring" as const, stiffness: 300, damping: 25 }

export function StampCard({
  imageSrc,
  serifFont,
  monoFont,
}: {
  imageSrc: string
  serifFont: string
  monoFont: string
}) {
  const now = new Date()
  const timestamp = `${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}.${String(now.getFullYear()).slice(-2)}`

  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0, rotateY: -4 }}
      animate={{ scale: 1, opacity: 1, rotateY: 0 }}
      transition={{ ...spring, delay: 0.05 }}
      className="stamp-edge linen-texture mx-auto w-[min(82vw,340px)] rounded-sm p-3 shadow-[0_8px_40px_rgba(0,0,0,0.35)]"
      style={{ perspective: 800 }}
    >
      {/* Captured image */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="relative aspect-[4/5] w-full overflow-hidden rounded-[6px]"
      >
        <img
          src={imageSrc}
          alt="Captured moment"
          className="h-full w-full object-cover"
          style={{ boxShadow: "inset 0 2px 12px rgba(0,0,0,0.18)" }}
        />
        {/* Inner shadow overlay */}
        <div className="pointer-events-none absolute inset-0 rounded-[6px] shadow-[inset_0_2px_12px_rgba(0,0,0,0.2)]" />
      </motion.div>

      {/* Metadata */}
      <div className="mt-3 space-y-1.5 px-0.5">
        {/* Top row: title + date */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.35 }}
          className="flex items-baseline justify-between"
        >
          <span
            className={`${serifFont} text-[11px] font-normal tracking-[0.15em] uppercase`}
            style={{ color: "#c8956c" }}
          >
            Cool Places
          </span>
          <span
            className={`${monoFont} text-[9px] tracking-wider`}
            style={{ color: "#a09484" }}
          >
            {timestamp}
          </span>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="h-px origin-left"
          style={{ backgroundColor: "#d8cfc4" }}
        />

        {/* Location */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.45 }}
          className={`${serifFont} text-[11px] italic`}
          style={{ color: "#6b5e52" }}
        >
          Tallinn, Estonia
        </motion.p>

        {/* Bottom row: username + serial */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.55 }}
          className="flex items-center justify-between pt-0.5"
        >
          <span
            className={`${monoFont} text-[9px]`}
            style={{ color: "#a09484" }}
          >
            @kristjan
          </span>
          <span
            className={`${monoFont} text-[9px] tracking-widest`}
            style={{ color: "#c8956c" }}
          >
            CP-0042
          </span>
        </motion.div>
      </div>
    </motion.div>
  )
}
