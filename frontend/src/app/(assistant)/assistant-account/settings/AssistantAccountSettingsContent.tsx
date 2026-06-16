"use client"

import { BellIcon, ShieldCheckIcon, SlidersHorizontalIcon } from "lucide-react"

import {
  AssistantSettingsPageContainer,
  useAssistantSettingsSection,
} from "../AssistantSettingsPageContainer"
import {
  AssistantDisplayPreferencesCard,
  AssistantNotificationsSettingsCard,
  AssistantSecuritySettingsCard,
} from "../AssistantAccount"
import { MOCK_PREFERENCES, MOCK_SECURITY } from "../assistantAccount.mock"
import { AccountSectionHeading, AccountSectionIntro } from "../assistantAccount.shared"

export function AssistantAccountSettingsContent() {
  const active = useAssistantSettingsSection()

  return (
    <AssistantSettingsPageContainer>
      {active === "security" ? (
        <section
          id="security"
          role="tabpanel"
          aria-labelledby="settings-tab-security"
          className="space-y-3"
        >
          <div>
            <AccountSectionHeading icon={ShieldCheckIcon} title="Sign-in protection" />
            <AccountSectionIntro>
              Strengthen your account security and monitor access.
            </AccountSectionIntro>
          </div>
          <AssistantSecuritySettingsCard security={MOCK_SECURITY} />
        </section>
      ) : null}

      {active === "notifications" ? (
        <section
          id="notifications"
          role="tabpanel"
          aria-labelledby="settings-tab-notifications"
          className="space-y-3"
        >
          <div>
            <AccountSectionHeading
              icon={BellIcon}
              title="Notification channels"
              iconClassName="text-amber-600"
            />
            <AccountSectionIntro>
              Choose which clinical alerts reach you during your shift.
            </AccountSectionIntro>
          </div>
          <AssistantNotificationsSettingsCard preferences={MOCK_PREFERENCES} />
        </section>
      ) : null}

      {active === "preferences" ? (
        <section
          id="preferences"
          role="tabpanel"
          aria-labelledby="settings-tab-preferences"
          className="space-y-3"
        >
          <div>
            <AccountSectionHeading icon={SlidersHorizontalIcon} title="Display preferences" />
            <AccountSectionIntro>
              Theme and language settings for your assistant workspace.
            </AccountSectionIntro>
          </div>
          <AssistantDisplayPreferencesCard preferences={MOCK_PREFERENCES} />
        </section>
      ) : null}
    </AssistantSettingsPageContainer>
  )
}
