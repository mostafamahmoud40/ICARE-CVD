import type { Metadata } from "next"

import { AssistantSettingsPageContainer } from "../AssistantSettingsPageContainer"
import {
  AssistantDisplayPreferencesCard,
  AssistantNotificationsSettingsCard,
  AssistantSecuritySettingsCard,
} from "../AssistantAccount"
import { MOCK_PREFERENCES, MOCK_SECURITY } from "../assistantAccount.mock"

export const metadata: Metadata = {
  title: "Settings | ICARE-CVD",
  description: "Assistant security, notifications, and preferences.",
}

export default function AssistantAccountSettingsPage() {
  return (
    <AssistantSettingsPageContainer>
      <section id="security" className="scroll-mt-28 sm:scroll-mt-32">
        <AssistantSecuritySettingsCard security={MOCK_SECURITY} />
      </section>
      <section id="notifications" className="scroll-mt-28 sm:scroll-mt-32">
        <AssistantNotificationsSettingsCard preferences={MOCK_PREFERENCES} />
      </section>
      <section id="preferences" className="scroll-mt-28 sm:scroll-mt-32">
        <AssistantDisplayPreferencesCard preferences={MOCK_PREFERENCES} />
      </section>
    </AssistantSettingsPageContainer>
  )
}
