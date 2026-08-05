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
      className={`${authSerif.className} flex min-h-screen items-center justify-center bg-[#F9F8F5] p-4 text-[#1A1F1E]`}
    >
      {children}
    </div>
  );
}
