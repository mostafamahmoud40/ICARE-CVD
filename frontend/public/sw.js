const ICARE_NOTIFICATION_CHANNEL = "icare-notifications"
const ICARE_NOTIFICATION_MESSAGE = "icare:notification"

function broadcastToPages(notification) {
  try {
    const channel = new BroadcastChannel(ICARE_NOTIFICATION_CHANNEL)
    channel.postMessage({
      type: ICARE_NOTIFICATION_MESSAGE,
      notification,
    })
    channel.close()
  } catch {
    /* BroadcastChannel unavailable in older workers */
  }
}

self.addEventListener("push", (event) => {
  let payload = {
    title: "ICARE-CVD",
    body: "You have a new clinic notification.",
    href: "/",
    notificationId: null,
    id: null,
    kind: "system",
    read: false,
    createdAt: null,
  }

  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() }
    }
  } catch {
    /* keep defaults */
  }

  const notification = {
    id: String(payload.id ?? payload.notificationId ?? ""),
    kind: payload.kind ?? "system",
    title: payload.title,
    body: payload.body,
    href: payload.href ?? "/",
    read: Boolean(payload.read),
    createdAt: payload.createdAt ?? new Date().toISOString(),
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      broadcastToPages(notification)

      windowClients.forEach((client) => {
        client.postMessage({
          type: ICARE_NOTIFICATION_MESSAGE,
          notification,
        })
      })

      const hasVisibleClient = windowClients.some(
        (client) => client.visibilityState === "visible",
      )

      if (hasVisibleClient) {
        return undefined
      }

      return self.registration.showNotification(payload.title, {
        body: payload.body,
        icon: "/images/logo/logo.png",
        badge: "/images/logo/logo.png",
        data: { url: payload.href },
        tag: notification.id ? `icare-${notification.id}` : "icare-notification",
        renotify: true,
      })
    }),
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url ?? "/"

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
      return undefined
    }),
  )
})
