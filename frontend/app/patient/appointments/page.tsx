import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PatientAppointmentsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointments</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Your upcoming and past appointments will appear here.
      </CardContent>
    </Card>
  );
}
