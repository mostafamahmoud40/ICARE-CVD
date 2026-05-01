"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useConsultationVoiceDictationError } from "./ConsultationVoiceDictationErrorContext"

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

function appendWithSmartSpace(base: string, piece: string): string {
  if (!piece) return base
  const needsSpace = base.length > 0 && !/\s$/.test(base) && !/^\s/.test(piece)
  return `${base}${needsSpace ? " " : ""}${piece}`
}

export type UseSpeechDictationOptions<K extends string> = {
  getText: (key: K) => string
  setText: (key: K, value: string) => void
}

export function useSpeechDictation<K extends string>({ getText, setText }: UseSpeechDictationOptions<K>) {
  const getTextRef = useRef(getText)
  const setTextRef = useRef(setText)
  const voiceErrorOutlet = useConsultationVoiceDictationError()

  useEffect(() => {
    getTextRef.current = getText
  }, [getText])

  useEffect(() => {
    setTextRef.current = setText
  }, [setText])

  const [supported, setSupported] = useState(false)
  const [activeKey, setActiveKey] = useState<K | null>(null)
  const [errorMessage, setLocalErrorMessage] = useState<string | null>(null)

  const publishError = useCallback(
    (msg: string | null, opts?: { allowMicRetry?: boolean }) => {
      setLocalErrorMessage(msg)
      if (msg === null) {
        voiceErrorOutlet?.setError(null)
      } else {
        voiceErrorOutlet?.setError({ message: msg, allowMicRetry: !!opts?.allowMicRetry })
      }
    },
    [voiceErrorOutlet],
  )
  const [interimText, setInterimText] = useState<string | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const recognitionRef = useRef<SpeechRecLike | null>(null)
  const activeKeyRef = useRef<K | null>(null)
  const baseTextRef = useRef("")
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const monitorDelayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const segmentRestartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startedAtRef = useRef<number | null>(null)
  const manualStopRef = useRef(false)
  const forcedRestartRef = useRef(false)
  const latestInterimRef = useRef("")
  const lastEmitAtRef = useRef(0)

  useEffect(() => {
    setSupported(!!getSpeechRecognitionCtor())
  }, [])

  const stopAudioMonitor = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (monitorDelayTimeoutRef.current) {
      clearTimeout(monitorDelayTimeoutRef.current)
      monitorDelayTimeoutRef.current = null
    }

    if (segmentRestartTimeoutRef.current) {
      clearTimeout(segmentRestartTimeoutRef.current)
      segmentRestartTimeoutRef.current = null
    }

    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect()
      } catch {
        /* noop */
      }
      sourceRef.current = null
    }

    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect()
      } catch {
        /* noop */
      }
      analyserRef.current = null
    }

    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop()
      }
      streamRef.current = null
    }

    if (audioContextRef.current) {
      void audioContextRef.current.close()
      audioContextRef.current = null
    }

    startedAtRef.current = null
    setAudioLevel(0)
    setElapsedSeconds(0)
  }, [])

  const startAudioMonitor = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return

      const audioContext = new Ctx()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 1024
      analyser.smoothingTimeConstant = 0.65
      analyser.minDecibels = -90
      analyser.maxDecibels = -10
      source.connect(analyser)

      if (audioContext.state === "suspended") {
        await audioContext.resume()
      }

      const freqSamples = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(freqSamples)
        let sum = 0
        for (let i = 0; i < freqSamples.length; i++) {
          sum += freqSamples[i]
        }
        const average = sum / freqSamples.length
        // Boost low values so normal speech visibly moves the meter.
        const normalized = Math.min(1, average / 28)
        const scaled = Math.round(Math.pow(normalized, 0.55) * 100)
        setAudioLevel(scaled)
        animationFrameRef.current = requestAnimationFrame(tick)
      }
      tick()

      startedAtRef.current = Date.now()
      setElapsedSeconds(0)
      timerRef.current = setInterval(() => {
        if (!startedAtRef.current) return
        const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000)
        setElapsedSeconds(elapsed)
      }, 1000)

      audioContextRef.current = audioContext
      streamRef.current = stream
      sourceRef.current = source
      analyserRef.current = analyser
    } catch {
      setAudioLevel(0)
    }
  }, [])

  const detachIfCurrent = useCallback((instance: SpeechRecLike) => {
    if (recognitionRef.current !== instance) return
    recognitionRef.current = null
    activeKeyRef.current = null
    baseTextRef.current = ""
    manualStopRef.current = false
    forcedRestartRef.current = false
    latestInterimRef.current = ""
    lastEmitAtRef.current = 0
    stopAudioMonitor()
    setActiveKey(null)
    setInterimText(null)
  }, [stopAudioMonitor])

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
      baseTextRef.current = ""
      manualStopRef.current = false
      forcedRestartRef.current = false
      latestInterimRef.current = ""
      lastEmitAtRef.current = 0
      stopAudioMonitor()
    }
  }, [stopAudioMonitor])

  const toggle = useCallback(
    (key: K) => {
      const Ctor = getSpeechRecognitionCtor()
      if (!Ctor) {
        publishError("Voice input is not supported in this browser. Try Chrome or Edge.")
        return
      }

      if (activeKeyRef.current === key && recognitionRef.current) {
        manualStopRef.current = true
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
        baseTextRef.current = ""
        manualStopRef.current = false
        forcedRestartRef.current = false
        latestInterimRef.current = ""
        lastEmitAtRef.current = 0
        stopAudioMonitor()
        setActiveKey(null)
        setInterimText(null)
      }

      publishError(null)
      setInterimText(null)

      const recognition = new Ctor()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = "ar-EG"

      activeKeyRef.current = key
      baseTextRef.current = getTextRef.current(key)
      manualStopRef.current = false
      forcedRestartRef.current = false
      latestInterimRef.current = ""
      lastEmitAtRef.current = 0
      setActiveKey(key)
      recognitionRef.current = recognition

      const flushInterimToBase = () => {
        const pending = latestInterimRef.current.trim()
        if (!pending) return
        baseTextRef.current = appendWithSmartSpace(baseTextRef.current, pending)
        latestInterimRef.current = ""
        setInterimText(null)
        setTextRef.current(key, baseTextRef.current)
      }

      const scheduleSegmentRestart = () => {
        if (segmentRestartTimeoutRef.current) {
          clearTimeout(segmentRestartTimeoutRef.current)
        }
        segmentRestartTimeoutRef.current = setTimeout(() => {
          if (manualStopRef.current) return
          if (recognitionRef.current !== recognition) return
          if (activeKeyRef.current !== key) return
          forcedRestartRef.current = true
          flushInterimToBase()
          try {
            recognition.stop()
          } catch {
            forcedRestartRef.current = false
          }
        }, 12000)
      }

      recognition.onresult = (event: SpeechRecEventLike) => {
        const k = activeKeyRef.current
        if (!k) return

        let finalChunk = ""
        let interimChunk = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const row = event.results[i]
          const t = row[0]?.transcript ?? ""
          if (row.isFinal) finalChunk += t
          else interimChunk += t
        }

        const finalized = finalChunk.trim()
        const interim = interimChunk.trim()
        latestInterimRef.current = interim

        if (finalized) {
          baseTextRef.current = appendWithSmartSpace(baseTextRef.current, finalized)
          latestInterimRef.current = ""
        }

        const nextValue = interim
          ? appendWithSmartSpace(baseTextRef.current, interim)
          : baseTextRef.current

        if (nextValue) {
          const now = Date.now()
          const hasFinal = finalized.length > 0
          const shouldEmit = hasFinal || now - lastEmitAtRef.current >= 80
          if (shouldEmit) {
            setTextRef.current(k, nextValue)
            lastEmitAtRef.current = now
          }
        }

        setInterimText(interim || null)
      }

      recognition.onerror = (ev: SpeechRecErrorLike) => {
        if (ev.error === "aborted") return
        if (ev.error === "no-speech") return

        if (ev.error === "not-allowed") {
          publishError("Microphone access was denied. Allow it from the browser address bar.", {
            allowMicRetry: true,
          })
          return
        }
        publishError(ev.message || ev.error || "Voice input error")
      }

      recognition.onend = () => {
        if (forcedRestartRef.current && !manualStopRef.current && activeKeyRef.current === key) {
          forcedRestartRef.current = false
          try {
            recognition.start()
            scheduleSegmentRestart()
            return
          } catch {
            /* fall through and detach */
          }
        }
        if (!manualStopRef.current && activeKeyRef.current === key) {
          try {
            recognition.start()
            scheduleSegmentRestart()
            return
          } catch {
            /* fall through and detach */
          }
        }
        detachIfCurrent(recognition)
      }

      try {
        recognition.start()
        scheduleSegmentRestart()
        monitorDelayTimeoutRef.current = setTimeout(() => {
          // Delay visual monitor so speech recognition can lock the mic immediately.
          void startAudioMonitor()
        }, 1500)
      } catch {
        publishError("Could not start the microphone. Check permissions.")
        detachIfCurrent(recognition)
      }
    },
    [detachIfCurrent, publishError, startAudioMonitor, stopAudioMonitor],
  )

  const dismissError = useCallback(() => publishError(null), [publishError])

  return { supported, activeKey, errorMessage, interimText, audioLevel, elapsedSeconds, toggle, dismissError }
}
