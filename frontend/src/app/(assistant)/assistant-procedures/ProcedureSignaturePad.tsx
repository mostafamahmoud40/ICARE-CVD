"use client"

import { useEffect, useRef, useState } from "react"
import { EraserIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type ProcedureSignaturePadProps = {
  onChange: (dataUrl: string | null) => void
  className?: string
  clearLabel: string
}

export function ProcedureSignaturePad({ onChange, className, clearLabel }: ProcedureSignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const [hasStroke, setHasStroke] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const ratio = window.devicePixelRatio || 1
      canvas.width = Math.floor(rect.width * ratio)
      canvas.height = Math.floor(rect.height * ratio)
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.lineWidth = 2.25
      ctx.strokeStyle = "#1A1F1E"
    }

    resize()
    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
  }, [])

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    const point = getPoint(event)
    if (!canvas || !ctx || !point) return

    drawingRef.current = true
    canvas.setPointerCapture(event.pointerId)
    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
  }

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    const point = getPoint(event)
    if (!canvas || !ctx || !point) return

    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    if (!hasStroke) setHasStroke(true)
    onChange(canvas.toDataURL("image/png"))
  }

  const stopDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    drawingRef.current = false
    const canvas = canvasRef.current
    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId)
    }
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasStroke(false)
    onChange(null)
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="overflow-hidden rounded-xl border border-[#E8E6E0] bg-[#FAFAF8]">
        <canvas
          ref={canvasRef}
          className="h-36 w-full touch-none cursor-crosshair sm:h-40"
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          aria-label="Signature pad"
        />
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 border-0 bg-transparent px-2 text-[12px] font-bold text-muted-foreground shadow-none hover:bg-transparent hover:text-[#1A5345]"
          onClick={clear}
          disabled={!hasStroke}
        >
          <EraserIcon className="size-3.5" aria-hidden />
          {clearLabel}
        </Button>
      </div>
    </div>
  )
}
