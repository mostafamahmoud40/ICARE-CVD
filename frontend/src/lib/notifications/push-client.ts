import { fetchVapidPublicKey, savePushSubscription } from "./notifications.api"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = window.atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i)
  }
  return output
}

export async function registerBrowserPush() {
  if (typeof window === "undefined") return false
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false

  const publicKey = await fetchVapidPublicKey()
  if (!publicKey) return false

  const permission = await Notification.requestPermission()
  if (permission !== "granted") return false

  const registration = await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
  })

  await navigator.serviceWorker.ready

  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  }

  const json = subscription.toJSON()
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false

  await savePushSubscription({
    endpoint: json.endpoint,
    keys: {
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
  })

  return true
}
