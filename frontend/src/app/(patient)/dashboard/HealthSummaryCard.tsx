type HealthSummaryCardProps = {
  patientName: string;
  nextAppointment: string;
};

export function HealthSummaryCard({ patientName, nextAppointment }: HealthSummaryCardProps) {
  return (
    <section className="w-full rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="text-lg font-semibold">Health Summary</h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Welcome back, {patientName}.</p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Next appointment: {nextAppointment}
      </p>
    </section>
  );
}
