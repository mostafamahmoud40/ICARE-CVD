import type { ReminderItem } from "./dashboard.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type UpcomingRemindersProps = {
  reminders: ReminderItem[];
};

export function UpcomingReminders({ reminders }: UpcomingRemindersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Reminders</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          {reminders.map((reminder) => (
            <li key={reminder.id}>
              {reminder.title} - {reminder.dueAt}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
