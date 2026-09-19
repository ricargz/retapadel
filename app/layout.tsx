import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/lib/theme/theme-script";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Retapadel",
    template: "%s | Retapadel",
  },
  description: "PWA offline para organizar torneos recreativos de padel con rotacion de parejas.",
  applicationName: "Retapadel",
  appleWebApp: {
    capable: true,
    title: "Retapadel",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/maskable.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F5F2" },
    { media: "(prefers-color-scheme: dark)", color: "#121514" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <ThemeScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
