let baseTitle: string | null = null

export function markBackgroundTabNotification() {
  if (typeof document === "undefined") return
  if (document.visibilityState === "visible") return

  if (!baseTitle) {
    baseTitle = document.title.replace(/^●\s+/, "")
  }

  if (!document.title.startsWith("● ")) {
    document.title = `● ${baseTitle}`
  }
}

export function clearBackgroundTabNotificationIndicator() {
  if (typeof document === "undefined") return
  if (!baseTitle) return

  document.title = baseTitle
  baseTitle = null
}
