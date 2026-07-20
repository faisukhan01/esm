import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ESM — Electronic School Management System",
  description: "Electronic School Management — a modern, multi-tenant school management platform with 30+ integrated modules: admissions, attendance, fees, academics, HR, library, transport, finance, e-learning hub, exam portal, online admissions, complaint portal, live transport, digital ID, campus wallet, health records & more.",
  keywords: ["school management system", "ESM", "education software", "student information system", "school ERP", "admissions", "attendance", "fee management"],
  authors: [{ name: "Cyber Advance Solutions" }],
  openGraph: {
    title: "ESM — Electronic School Management System",
    description: "The complete school management platform with 31+ integrated modules.",
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
        className={`${inter.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
