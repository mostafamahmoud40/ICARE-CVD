"use client"

import { useState, useEffect, useRef, useCallback } from "react"

type TypewriterTextProps = {
  text: string
  speed?: number
  onComplete?: () => void
  className?: string
}

export function TypewriterText({ text, speed = 12, onComplete, className }: TypewriterTextProps) {
  const [displayedLength, setDisplayedLength] = useState(0)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const isComplete = displayedLength >= text.length

  useEffect(() => {
    if (displayedLength >= text.length) return

    const timer = setInterval(() => {
      setDisplayedLength((prev) => {
        const next = prev + 1
        if (next >= text.length) {
          clearInterval(timer)
        }
        return next
      })
    }, speed)

    return () => clearInterval(timer)
  }, [text, speed, displayedLength])

  const handleComplete = useCallback(() => {
    if (isComplete && onCompleteRef.current) {
      onCompleteRef.current()
    }
  }, [isComplete])

  useEffect(() => {
    if (isComplete) {
      handleComplete()
    }
  }, [isComplete, handleComplete])

  return (
    <span className={className}>
      {text.slice(0, displayedLength)}
      {!isComplete && (
        <span className="inline-block w-[2px] animate-pulse bg-[#1A5345] ml-0.5 align-middle">&nbsp;</span>
      )}
    </span>
  )
}
