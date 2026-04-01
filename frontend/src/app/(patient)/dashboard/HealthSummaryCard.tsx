import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type HealthSummaryCardProps = {
  patientName: string;
  nextAppointment: string;
};

export function HealthSummaryCard({ patientName, nextAppointment }: HealthSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
        <p>Welcome back, {patientName}.</p>
        <p>Next appointment: {nextAppointment}</p>
      </CardContent>
    </Card>
  );
}
