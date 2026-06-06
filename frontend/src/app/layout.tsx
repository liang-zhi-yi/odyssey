import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "./components/Navbar";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { HtmlLang } from "./components/HtmlLang";
import { AgentSidebar } from "./components/AgentSidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Odyssey — AI Capability Growth OS",
  description:
    "Odyssey is an AI-powered capability growth operating system. Prove your skills, earn credentials, build your passport.",
  openGraph: {
    title: "Odyssey — AI Capability Growth OS",
    description: "Prove your skills, earn credentials, build your passport.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Odyssey — AI Capability Growth OS",
    description: "Prove your skills, earn credentials, build your passport.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased transition-colors duration-300">
        <Providers>
          <HtmlLang />
          <Navbar />
          <main className="mx-auto max-w-7xl px-6 py-8 pb-16 page-enter">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
          <AgentSidebar />
        </Providers>
      </body>
    </html>
  );
}
