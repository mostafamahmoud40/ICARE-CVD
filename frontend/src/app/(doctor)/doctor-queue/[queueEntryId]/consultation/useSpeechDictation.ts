"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type SpeechRecResultLike = {
  isFinal: boolean
  0: { transcript: string }
}

type SpeechRecEventLike = Event & {
  resultIndex: number
  results: { length: number; [i: number]: SpeechRecResultLike }
}

type SpeechRecErrorLike = Event & {
  error: string
  message: string
}

type SpeechRecLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((ev: SpeechRecEventLike) => void) | null
  onerror: ((ev: SpeechRecErrorLike) => void) | null
  onend: (() => void) | null
}

function getSpeechRecognitionCtor(): (new () => SpeechRecLike) | null {
  if (typeof window === "undefined") return null
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecLike
    webkitSpeechRecognition?: new () => SpeechRecLike
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export type UseSpeechDictationOptions<K extends string> = {
  getText: (key: K) => string
  setText: (key: K, value: string) => void
}

export function useSpeechDictation<K extends string>({ getText, setText }: UseSpeechDictationOptions<K>) {
  const getTextRef = useRef(getText)
  const setTextRef = useRef(setText)

  useEffect(() => {
    getTextRef.current = getText
  }, [getText])

  useEffect(() => {
    setTextRef.current = setText
  }, [setText])

  const [supported, setSupported] = useState(false)
  const [activeKey, setActiveKey] = useState<K | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [interimText, setInterimText] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecLike | null>(null)
  const activeKeyRef = useRef<K | null>(null)

  useEffect(() => {
    setSupported(!!getSpeechRecognitionCtor())
  }, [])

  const detachIfCurrent = useCallback((instance: SpeechRecLike) => {
    if (recognitionRef.current !== instance) return
    recognitionRef.current = null
    activeKeyRef.current = null
    setActiveKey(null)
    setInterimText(null)
  }, [])

  useEffect(() => {
    return () => {
      const r = recognitionRef.current
      if (!r) return
      r.onresult = null
      r.onerror = null
      r.onend = null
      try {
        r.abort()
      } catch {
        /* noop */
      }
      recognitionRef.current = null
      activeKeyRef.current = null
    }
  }, [])

  const toggle = useCallback(
    (key: K) => {
      const Ctor = getSpeechRecognitionCtor()
      if (!Ctor) {
        setErrorMessage("Voice input is not supported in this browser. Try Chrome or Edge.")
        return
      }

      if (activeKeyRef.current === key && recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {
          /* noop */
        }
        return
      }

      if (recognitionRef.current) {
        const prev = recognitionRef.current
        prev.onresult = null
        prev.onerror = null
        prev.onend = null
        try {
          prev.abort()
        } catch {
          /* noop */
        }
        recognitionRef.current = null
        activeKeyRef.current = null
        setActiveKey(null)
        setInterimText(null)
      }

      setErrorMessage(null)
      setInterimText(null)

      const recognition = new Ctor()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang =
        typeof navigator !== "undefined" && navigator.language ? navigator.language : "en-US"

      activeKeyRef.current = key
      setActiveKey(key)
      recognitionRef.current = recognition

      recognition.onresult = (event: SpeechRecEventLike) => {
        const k = activeKeyRef.current
        if (!k) return

        let finals = ""
        let interim = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const row = event.results[i]
          const t = row[0]?.transcript ?? ""
          if (row.isFinal) finals += t
          else interim += t
        }

        if (finals.trim()) {
          const prev = getTextRef.current(k)
          const piece = finals.trim()
          const needsSpace = prev.length > 0 && !/\s$/.test(prev) && !/^\s/.test(piece)
          setTextRef.current(k, `${prev}${needsSpace ? " " : ""}${piece}`)
        }

        setInterimText(interim.trim() ? interim : null)
      }

      recognition.onerror = (ev: SpeechRecErrorLike) => {
        if (ev.error === "aborted") return
        if (ev.error === "no-speech") return

        const msg =
          ev.error === "not-allowed"
            ? "Microphone access was denied. Allow it from the browser address bar."
            : ev.message || ev.error || "Voice input error"
        setErrorMessage(msg)
      }

      recognition.onend = () => {
        detachIfCurrent(recognition)
      }

      try {
        recognition.start()
      } catch {
        setErrorMessage("Could not start the microphone. Check permissions.")
        detachIfCurrent(recognition)
      }
    },
    [detachIfCurrent],
  )

  const dismissError = useCallback(() => setErrorMessage(null), [])

  return { supported, activeKey, errorMessage, interimText, toggle, dismissError }
}
