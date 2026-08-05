"use client"

import { useEffect, useState } from "react"

export function useElapsedTime(startISO: string | null): string | null {
  const [elapsed, setElapsed] = useState<string | null>(null)

  useEffect(() => {
    if (!startISO) {
      setElapsed(null)
      return
    }
    const compute = () => {
      const diff = Math.floor((Date.now() - new Date(startISO).getTime()) / 1000)
      if (diff < 0) {
        setElapsed(null)
        return
      }
      const h = Math.floor(diff / 3600)
      const m = Math.floor((diff % 3600) / 60)
      const s = diff % 60
      setElapsed(
        h > 0
          ? `${h}h ${String(m).padStart(2, "0")}m`
          : `${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`,
      )
    }
    compute()
    const id = setInterval(compute, 1000)
    return () => clearInterval(id)
  }, [startISO])

  return elapsed
}
