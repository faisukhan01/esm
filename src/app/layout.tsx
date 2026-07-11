import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "ESM — Electronic School Management System",
  description: "Pakistan's No. 1 School Management System. 22 integrated modules: admissions, attendance, fees, results, academics, HR, library, transport, finance & more. Trusted by 10,000+ institutions across 5 countries.",
  keywords: ["school management system", "ESM", "education software", "student information system", "school ERP", "admissions", "attendance", "fee management"],
  authors: [{ name: "Cyber Advance Solutions" }],
  openGraph: {
    title: "ESM — Electronic School Management System",
    description: "The complete school management platform. 22 modules, 1M+ students, 10K+ institutions.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
