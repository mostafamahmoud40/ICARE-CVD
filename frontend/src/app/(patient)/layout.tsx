import { Lora } from "next/font/google"
import { PatientPortalShell } from "./PatientPortalShell"

const patientSerif = Lora({
  subsets: ["latin"],
  display: "swap",
})

export default function PatientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div
      className={`${patientSerif.className} min-h-screen bg-background text-foreground dark:bg-background`}
    >
      <PatientPortalShell>{children}</PatientPortalShell>
    </div>
  )
}

