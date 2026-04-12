import { Lora } from "next/font/google";

const authSerif = Lora({
  subsets: ["latin"],
  display: "swap",
});

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`${authSerif.className} flex min-h-screen items-center justify-center bg-gradient-to-br from-secondary via-background to-secondary/60 p-4 text-foreground`}
    >
      {children}
    </div>
  );
}
