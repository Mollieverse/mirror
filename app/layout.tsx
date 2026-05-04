import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { SimActivityPanel } from "@/components/SimActivityPanel";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mirror — The wallet that watches you back.",
  description:
    "Connect your wallet. Mirror builds your trading psyche, mirrors your behavior, and tells you the truth nobody else will. Powered by Dune SIM.",
  openGraph: {
    title: "Mirror",
    description: "The wallet that watches you back.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${instrumentSerif.variable}`}
    >
      <body
        style={{
          fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
        }}
      >
        {children}
        <SimActivityPanel />
      </body>
    </html>
  );
}
