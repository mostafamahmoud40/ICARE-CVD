"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import { XIcon } from "lucide-react"
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

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
  const [banner, setBannerState] = useState<VoiceDictationBannerPayload | null>(null)
  const [micRequestPending, setMicRequestPending] = useState(false)

  const setError = useCallback((payload: VoiceDictationBannerPayload | null) => {
    setBannerState(payload)
  }, [])

  const requestMicAccess = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return
    setMicRequestPending(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
      setBannerState(null)
    } catch {
      setBannerState({
        message:
          "Microphone is still blocked. Use the lock or site settings icon in the address bar to allow the microphone, then tap Allow again.",
        allowMicRetry: true,
      })
    } finally {
      setMicRequestPending(false)
    }
  }, [])

  const value = useMemo(() => ({ setError }), [setError])

  return (
    <VoiceDictationErrorContext.Provider value={value}>
      {children}
      {banner ? (
        <div
          className="pointer-events-none fixed left-1/2 top-[4.5rem] z-[200] w-[min(100%-2rem,42rem)] -translate-x-1/2 px-4"
          role="presentation"
        >
          <Alert variant="destructive" className="pointer-events-auto py-2 shadow-lg">
            <AlertTitle className="text-xs">Voice input</AlertTitle>
            <AlertDescription className="text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 flex-1 text-pretty text-destructive/90">{banner.message}</p>
                {banner.allowMicRetry ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-6 shrink-0 px-2 py-0 text-[10px] font-medium"
                    disabled={micRequestPending}
                    aria-label={micRequestPending ? "Requesting microphone access" : "Allow microphone access"}
                    onClick={() => void requestMicAccess()}
                  >
                    {micRequestPending ? "…" : "Allow"}
                  </Button>
                ) : null}
              </div>
            </AlertDescription>
            <AlertAction>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => setBannerState(null)}
                aria-label="Dismiss voice input message"
              >
                <XIcon className="size-3.5" />
              </Button>
            </AlertAction>
          </Alert>
        </div>
      ) : null}
    </VoiceDictationErrorContext.Provider>
  )
}
