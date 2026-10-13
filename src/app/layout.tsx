import { Outfit, Syne } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import { HapticRoot } from "@/components/haptic-root";
import { PwaRegister } from "@/components/pwa-register";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
});

const siteUrl = process.env.APP_URL?.trim() || "https://www.apblitz.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AP Blitz — your AP classes, explained by students",
    template: "%s · AP Blitz",
  },
  description:
    "AP Blitz makes free AP review videos and resources so students can understand hard concepts and prepare for exams.",
  applicationName: "AP Blitz",
  icons: {
    icon: [{ url: "/logo-ap-blitz.png", type: "image/png" }],
    apple: [{ url: "/logo-ap-blitz.png" }],
    shortcut: ["/logo-ap-blitz.png"],
  },
  openGraph: {
    title: "AP Blitz",
    description: "Your AP classes. Explained by students, for students.",
    siteName: "AP Blitz",
    images: [{ url: "/logo-ap-blitz.png", alt: "AP Blitz" }],
  },
  appleWebApp: {
    capable: true,
    title: "AP Blitz",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${syne.variable} h-full antialiased`}>
      <body className="min-h-full bg-ink font-sans text-paper">
        <HapticRoot />
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
