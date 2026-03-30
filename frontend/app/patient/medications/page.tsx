import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PatientMedicationsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Medications</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Medication schedule and adherence details will appear here.
      </CardContent>
    </Card>
  );
}
