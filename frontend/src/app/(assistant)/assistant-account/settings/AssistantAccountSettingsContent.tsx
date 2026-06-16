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
import { useAssistantAccountTranslations } from "../account-i18n"

export function AssistantAccountSettingsContent() {
  const active = useAssistantSettingsSection()
  const { t } = useAssistantAccountTranslations()

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
            <AccountSectionHeading icon={ShieldCheckIcon} title={t("security.sectionTitle")} />
            <AccountSectionIntro>{t("security.sectionIntro")}</AccountSectionIntro>
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
              title={t("notifications.sectionTitle")}
              iconClassName="text-amber-600"
            />
            <AccountSectionIntro>{t("notifications.sectionIntro")}</AccountSectionIntro>
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
            <AccountSectionHeading icon={SlidersHorizontalIcon} title={t("preferences.sectionTitle")} />
            <AccountSectionIntro>{t("preferences.sectionIntro")}</AccountSectionIntro>
          </div>
          <AssistantDisplayPreferencesCard preferences={MOCK_PREFERENCES} />
        </section>
      ) : null}
    </AssistantSettingsPageContainer>
  )
}
