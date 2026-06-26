"use client"

import { useEffect, useRef } from "react"

type PlotlyModule = {
  default?: PlotlyStatic
} & PlotlyStatic

type PlotlyStatic = {
  newPlot: (
    root: HTMLElement,
    data: unknown[],
    layout?: Record<string, unknown>,
    config?: Record<string, unknown>,
  ) => Promise<void>
  purge?: (root: HTMLElement) => void
}

export type MriPlotlyChartProps = {
  data: unknown
  className?: string
}

async function loadPlotly(): Promise<PlotlyStatic> {
  const mod = (await import("plotly.js-dist-min")) as PlotlyModule
  return mod.default ?? mod
}

export function MriPlotlyChart({ data, className }: MriPlotlyChartProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

    async function draw() {
      const Plotly = await loadPlotly()
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

    void draw()

    return () => {
      cancelled = true
      const node = ref.current
      if (!node) return
      void loadPlotly()
        .then((Plotly) => {
          Plotly.purge?.(node)
        })
        .catch(() => {})
    }
  }, [data])

  return <div ref={ref} className={className || "h-72 w-full"} />
}
