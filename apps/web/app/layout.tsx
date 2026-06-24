import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import HarvestQueryProvider from "@/components/HarvestQueryProvider";
import { Sonner } from "@/components/ui/sonner";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Harvest Coffee Platform",
  description: "B2B ordering and operations workspace for Harvest Coffee.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${fraunces.variable}`}>
      <body suppressHydrationWarning>
        <HarvestQueryProvider>
          {children}
          <Sonner />
        </HarvestQueryProvider>
      </body>
    </html>
  );
}
