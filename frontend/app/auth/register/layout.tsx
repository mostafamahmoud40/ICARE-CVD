import { RegisterFlowProvider } from "./register-flow-provider";

export default function RegisterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RegisterFlowProvider>{children}</RegisterFlowProvider>;
}
