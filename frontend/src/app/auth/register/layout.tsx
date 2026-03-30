import { RegisterProvider } from "./useRegister";

export default function RegisterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RegisterProvider>{children}</RegisterProvider>;
}
