import { Lora } from "next/font/google"

import { DoctorPortalShell } from "./DoctorPortalShell"

const doctorSerif = Lora({
  subsets: ["latin"],
  display: "swap",
})

export default function DoctorLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div
      className={`${doctorSerif.className} min-h-screen bg-background text-foreground dark:bg-background`}
    >
      <DoctorPortalShell>{children}</DoctorPortalShell>
    </div>
  )
}

