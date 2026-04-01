import { PrescriptionForm } from "./PrescriptionForm";

export default function PrescriptionsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold">Prescriptions</h1>
      <PrescriptionForm />
    </main>
  );
}
