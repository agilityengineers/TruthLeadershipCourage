import type { Metadata } from "next";
import { Inter, Montserrat, Roboto } from "next/font/google";
import "./globals.css";

/**
 * TLC brand type system (per Tri's font direction):
 *   • Header titles → Aptos
 *   • Body          → Montserrat
 *   • Subtitles     → Roboto
 *
 * Aptos is a licensed Microsoft font and is not available on Google Fonts, so we
 * render header titles in Inter (a close humanist-sans stand-in) for now. To use
 * the real Aptos, add the font files under src/app/fonts and swap this for
 * next/font/local — only this block changes; the --font-aptos variable stays.
 */
const aptos = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-aptos",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
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
    description: "A practical leadership operating system. Enrolling now.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${aptos.variable} ${montserrat.variable} ${roboto.variable}`}>
      <body className="min-h-screen bg-page text-ink antialiased">{children}</body>
    </html>
  );
}
