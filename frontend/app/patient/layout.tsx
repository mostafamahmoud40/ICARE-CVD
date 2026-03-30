import type { ReactNode } from "react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { PatientSidebar } from "./_components/patient-sidebar";

export default function PatientLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <PatientSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur-sm">
          <SidebarTrigger />
          <p className="text-sm font-medium text-muted-foreground">Patient Dashboard</p>
        </header>
        <div className="flex flex-1 flex-col p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
