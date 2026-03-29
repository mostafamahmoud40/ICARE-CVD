"use client";

import { createContext, useContext, useMemo } from "react";
import { useRegisterForm } from "./_hooks/use-register-form";
import { createHttpRegisterService } from "./services/http-register.service";

type RegisterFlowContextValue = ReturnType<typeof useRegisterForm>;

const RegisterFlowContext = createContext<RegisterFlowContextValue | null>(null);

export function RegisterFlowProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const register = useMemo(() => createHttpRegisterService(), []);
  const value = useRegisterForm({ register });

  return (
    <RegisterFlowContext.Provider value={value}>
      {children}
    </RegisterFlowContext.Provider>
  );
}

export function useRegisterFlow() {
  const context = useContext(RegisterFlowContext);

  if (!context) {
    throw new Error("useRegisterFlow must be used within RegisterFlowProvider");
  }

  return context;
}
