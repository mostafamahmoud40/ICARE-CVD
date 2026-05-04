"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HeartPulse, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it Works" },
  { href: "#audience", label: "For You" },
  { href: "#stats", label: "Impact" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#faq", label: "FAQ" },
];

/**
 * Marketing top navigation. Becomes solid + adds shadow once the user scrolls.
 * Uses a Sheet drawer for the mobile menu.
 */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border/60 bg-background/85 shadow-sm backdrop-blur-xl"
          : "border-b border-transparent bg-background/40 backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex h-16 md:h-20 max-w-7xl items-center justify-between px-6 md:px-12">
        <Link
          href="/"
          className="group flex items-center gap-2.5 transition-transform duration-300 hover:scale-[1.03]"
        >
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-brand-teal/10 ring-1 ring-brand-teal/20">
            <HeartPulse className="h-6 w-6 text-brand-red transition-transform duration-500 group-hover:scale-110" />
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            ICARE<span className="text-brand-teal">-CVD</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative text-muted-foreground transition-colors hover:text-brand-teal after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-brand-teal after:transition-all after:duration-300 hover:after:w-full"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex text-sm font-medium text-muted-foreground transition-colors hover:text-brand-teal"
          >
            Sign In
          </Link>
          <Link href="/login" className="hidden sm:inline-flex">
            <Button className="rounded-full bg-brand-teal px-6 text-white shadow-md transition-all hover:bg-brand-teal/90 hover:shadow-xl hover:shadow-brand-teal/25">
              Get Started
            </Button>
          </Link>

          {/* Mobile trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-foreground"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85%] sm:w-[360px] p-0">
              <SheetHeader className="border-b border-border/60 p-6">
                <SheetTitle className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-teal/10">
                    <HeartPulse className="h-5 w-5 text-brand-red" />
                  </div>
                  <span className="text-lg font-bold tracking-tight">
                    ICARE<span className="text-brand-teal">-CVD</span>
                  </span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col p-6 gap-1">
                {NAV_LINKS.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className="rounded-lg px-3 py-2.5 text-base font-medium text-muted-foreground transition-colors hover:bg-brand-teal/5 hover:text-brand-teal"
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
                <div className="mt-6 flex flex-col gap-3 border-t border-border/60 pt-6">
                  <SheetClose asChild>
                    <Link href="/login">
                      <Button
                        variant="outline"
                        className="w-full rounded-full border-brand-teal/30 text-brand-teal"
                      >
                        Sign In
                      </Button>
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/login">
                      <Button className="w-full rounded-full bg-brand-teal text-white hover:bg-brand-teal/90">
                        Get Started
                      </Button>
                    </Link>
                  </SheetClose>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
