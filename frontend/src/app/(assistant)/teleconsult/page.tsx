import { TeleconsultRoom } from "./TeleconsultRoom";

export default function TeleconsultPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold">Teleconsult</h1>
      <TeleconsultRoom />
    </main>
  );
}
