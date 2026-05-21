import { AssistantAccount } from "./AssistantAccount"
import {
  MOCK_PROFILE,
  MOCK_ACTIVITY_LOG,
  MOCK_WEEKLY_STATS,
  MOCK_SHIFT_SCHEDULE,
} from "./assistantAccount.mock"

export default function AssistantAccountPage() {
  return (
    <AssistantAccount
      profile={MOCK_PROFILE}
      activities={MOCK_ACTIVITY_LOG}
      weeklyStats={MOCK_WEEKLY_STATS}
      shifts={MOCK_SHIFT_SCHEDULE}
    />
  )
}
