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
      className={`${authSerif.className} flex min-h-screen flex-col items-center justify-center bg-[#f4f4f5] px-4 py-10 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50`}
    >
      {children}
    </div>
  );
}
