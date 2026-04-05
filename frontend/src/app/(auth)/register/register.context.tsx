"use client";

import { createContext, useContext, type PropsWithChildren } from "react";

import { useRegisterForm } from "./useRegisterForm";

type RegisterContextValue = ReturnType<typeof useRegisterForm>;

const RegisterContext = createContext<RegisterContextValue | null>(null);

export function RegisterProvider({ children }: PropsWithChildren) {
  const value = useRegisterForm();

  return <RegisterContext.Provider value={value}>{children}</RegisterContext.Provider>;
}

export function useRegisterContext() {
  const context = useContext(RegisterContext);

  if (!context) {
    throw new Error("useRegisterContext must be used within RegisterProvider");
  }

  return context;
}
