"use client"

import { useEffect, useRef } from "react"

export type MriPlotlyChartProps = {
  data: unknown
  className?: string
}

export function MriPlotlyChart({ data, className }: MriPlotlyChartProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

    async function draw() {
      const mod: any = await import("plotly.js-dist-min")
      const Plotly = mod.default || mod
      if (cancelled || !ref.current) return

      const payload = data as Record<string, unknown>
      const plotData = (payload.data || []) as unknown[]
      const plotLayout = (payload.layout || {}) as Record<string, unknown>
      const plotConfig = (payload.config || {}) as Record<string, unknown>

      await Plotly.newPlot(ref.current, plotData, plotLayout, {
        displayModeBar: true,
        responsive: true,
        ...plotConfig,
      })
    }

    draw()

    return () => {
      cancelled = true
      if (ref.current) {
        import("plotly.js-dist-min")
          .then((mod: any) => {
            const Plotly = mod.default || mod
            Plotly.purge?.(ref.current!)
          })
          .catch(() => {})
      }
    }
  }, [data])

  return <div ref={ref} className={className || "h-72 w-full"} />
}
