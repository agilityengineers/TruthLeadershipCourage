import type { Metadata } from "next";
import { Newsreader, Public_Sans } from "next/font/google";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-public-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TLC — Truth Leadership Courage | The Wisdom Tri",
    template: "%s · The Wisdom Tri",
  },
  description:
    "Grow into your best as a leader — and become a leader worth following. A six-month cohort-based leadership program built on the EQ · IQ · MQ™ method.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "TLC — Truth Leadership Courage",
    description: "A practical leadership operating system. Fall 2026 cohort enrolling.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${newsreader.variable} ${publicSans.variable}`}>
      <body className="min-h-screen bg-page text-ink antialiased">{children}</body>
    </html>
  );
}
