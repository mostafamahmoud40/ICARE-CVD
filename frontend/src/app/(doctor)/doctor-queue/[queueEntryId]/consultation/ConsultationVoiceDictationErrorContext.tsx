"use client"

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react"
import { toast } from "sonner"

const VOICE_TOAST_ID = "voice-dictation-error"

export type VoiceDictationBannerPayload = {
  message: string
  allowMicRetry: boolean
}

type VoiceDictationErrorContextValue = {
  setError: (payload: VoiceDictationBannerPayload | null) => void
}

const VoiceDictationErrorContext = createContext<VoiceDictationErrorContextValue | null>(null)

export function useConsultationVoiceDictationError() {
  return useContext(VoiceDictationErrorContext)
}

export function ConsultationVoiceDictationErrorProvider({ children }: { children: ReactNode }) {
  const requestMicAccess = useCallback(async function requestMicAccess() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
      toast.dismiss(VOICE_TOAST_ID)
    } catch {
      toast.error("Voice input", {
        id: VOICE_TOAST_ID,
        description:
          "Microphone is still blocked. Use the lock or site settings icon in the address bar to allow the microphone, then tap Allow again.",
        duration: Infinity,
        action: {
          label: "Allow",
          onClick: () => void requestMicAccess(),
        },
      })
    }
  }, [])

  const setError = useCallback(
    (payload: VoiceDictationBannerPayload | null) => {
      if (payload === null) {
        toast.dismiss(VOICE_TOAST_ID)
        return
      }

      toast.error("Voice input", {
        id: VOICE_TOAST_ID,
        description: payload.message,
        duration: payload.allowMicRetry ? Infinity : 5000,
        action: payload.allowMicRetry
          ? {
              label: "Allow",
              onClick: () => void requestMicAccess(),
            }
          : undefined,
      })
    },
    [requestMicAccess],
  )

  const value = useMemo(() => ({ setError }), [setError])

  return (
    <VoiceDictationErrorContext.Provider value={value}>
      {children}
    </VoiceDictationErrorContext.Provider>
  )
}
