import type { Metadata } from "next"

import { AssistantDisplayPreferencesCard } from "../AssistantAccount"
import { MOCK_PREFERENCES } from "../assistantAccount.mock"

export const metadata: Metadata = {
  title: "Preferences | ICARE-CVD",
  description: "Assistant display and language preferences.",
}

export default function AssistantAccountPreferencesPage() {
  return (
    <div className="space-y-4 p-3 sm:space-y-5 sm:p-4 lg:p-5">
      <div>
        <h1 className="text-[13px] font-bold text-[#102F27] sm:text-[15px]">Preferences</h1>
        <p className="mt-0.5 text-[10px] text-[#6B7870] sm:text-[11px]">
          Theme and language
        </p>
      </div>
      <div className="max-w-2xl">
        <AssistantDisplayPreferencesCard preferences={MOCK_PREFERENCES} />
      </div>
    </div>
  )
}
