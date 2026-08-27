import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { IdleCookieWatcher } from "@/components/idle-cookie-watcher";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-100 font-sans text-gray-900">
        <IdleCookieWatcher />
        {children}
      </body>
    </html>
  );
}
