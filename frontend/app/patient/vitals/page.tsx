import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PatientVitalsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vitals</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Detailed vital sign history will appear here.
      </CardContent>
    </Card>
  );
}
