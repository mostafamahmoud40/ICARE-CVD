import { useTranslations } from "next-intl"

type AssistantPage =
  | "appointments"
  | "patients"
  | "queue"
  | "doctors"
  | "account"
  | "doctorSchedule"
  | "procedures"

/** Use nested keys under `assistant` (same pattern as sidebar `t("nav.*")`). */
export function useAssistantPageTranslations(page: AssistantPage) {
  const messages = useTranslations("assistant")

  return {
    t: (key: string, values?: Record<string, string | number | Date>) =>
      messages(`pages.${page}.${key}`, values),
    ts: (key: string, values?: Record<string, string | number | Date>) =>
      messages(`shared.${key}`, values),
  }
}

export function useAssistantSharedTranslations() {
  const messages = useTranslations("assistant")
  return (key: string) => messages(`shared.${key}`)
}
