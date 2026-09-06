import { Outfit, Syne } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import { HapticRoot } from "@/components/haptic-root";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
});

export const metadata: Metadata = {
  title: {
    default: "AP Blitz — student-run AP content",
    template: "%s · AP Blitz",
  },
  description:
    "AP Blitz is a student-run organization that makes AP review videos, scripts, graphics, and social content — built by students, for students.",
  icons: {
    icon: [{ url: "/logo-ap-blitz.png", type: "image/png" }],
    apple: [{ url: "/logo-ap-blitz.png" }],
    shortcut: ["/logo-ap-blitz.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${syne.variable} h-full antialiased`}>
      <body className="min-h-full bg-ink font-sans text-paper">
        <HapticRoot />
        {children}
      </body>
    </html>
  );
}
