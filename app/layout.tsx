import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

import { IdleCookieWatcher } from "@/components/idle-cookie-watcher";
import { SkipLink } from "@/components/skip-link";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "PRAAMS",
    template: "%s | PRAAMS",
  },
  description:
    "Patient Record and Appointment Management System — internal staff portal for Addis Ababa Private Clinic.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-surface font-sans text-gray-900">
        <SkipLink />
        <IdleCookieWatcher />
        {children}
      </body>
    </html>
  );
}
