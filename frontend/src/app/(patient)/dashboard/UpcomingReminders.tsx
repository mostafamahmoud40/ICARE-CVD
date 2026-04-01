import type { ReminderItem } from "./dashboard.types";

type UpcomingRemindersProps = {
  reminders: ReminderItem[];
};

export function UpcomingReminders({ reminders }: UpcomingRemindersProps) {
  return (
    <section className="w-full rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="text-lg font-semibold">Upcoming Reminders</h2>
      <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
        {reminders.map((reminder) => (
          <li key={reminder.id}>
            {reminder.title} - {reminder.dueAt}
          </li>
        ))}
      </ul>
    </section>
  );
}
