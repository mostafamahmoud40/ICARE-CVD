export default function AssistantAccountNotificationsRedirectPage() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#F9F8F5]">
      <meta httpEquiv="refresh" content="0; url=/assistant-account/settings#notifications" />
      <div className="text-center">
        <p className="font-sans text-[13px] text-muted-foreground animate-pulse">Redirecting to settings...</p>
      </div>
    </div>
  )
}
