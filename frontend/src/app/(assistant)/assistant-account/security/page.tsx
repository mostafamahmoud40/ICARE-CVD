import type { Metadata } from "next"

import { AssistantSecuritySettingsCard } from "../AssistantAccount"
import { MOCK_SECURITY } from "../assistantAccount.mock"

export const metadata: Metadata = {
  title: "Security | ICARE-CVD",
  description: "Assistant account security and sessions.",
}

export default function AssistantAccountSecurityPage() {
  return (
    <div className="space-y-4 p-3 sm:space-y-5 sm:p-4 lg:p-5">
      <div>
        <h1 className="text-[13px] font-bold text-[#102F27] sm:text-[15px]">Security</h1>
        <p className="mt-0.5 text-[10px] text-[#6B7870] sm:text-[11px]">
          Two-factor authentication, passwords, and active sessions
        </p>
      </div>
      <div className="max-w-2xl">
        <AssistantSecuritySettingsCard security={MOCK_SECURITY} />
      </div>
    </div>
  )
}
