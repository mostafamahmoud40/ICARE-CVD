import { AssistantAccount } from "./AssistantAccount"
import {
  MOCK_PROFILE,
  MOCK_WORK_STATS,
  MOCK_ACTIVITY_LOG,
  MOCK_WEEKLY_STATS,
  MOCK_SHIFT_SCHEDULE,
} from "./assistantAccount.mock"

export default function AssistantAccountPage() {
  return (
    <AssistantAccount
      profile={MOCK_PROFILE}
      stats={MOCK_WORK_STATS}
      activities={MOCK_ACTIVITY_LOG}
      weeklyStats={MOCK_WEEKLY_STATS}
      shifts={MOCK_SHIFT_SCHEDULE}
    />
  )
}
