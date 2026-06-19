import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "./components/Navbar";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { HtmlLang } from "./components/HtmlLang";
import { AgentSidebar } from "./components/AgentSidebar";
import { PageGlassWrapper } from "./components/PageGlassWrapper";
import { MainWrapper } from "./components/MainWrapper";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Odyssey — AI-Powered Personal Civilization Builder",
  description:
    "Build your own capability civilization. From skills to buildings, from buildings to civilizations — your learning becomes a world you can see.",
  openGraph: {
    title: "Odyssey — AI-Powered Personal Civilization Builder",
    description:
      "Build your own capability civilization. From skills to buildings, from buildings to civilizations — your learning becomes a world you can see.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Odyssey — AI-Powered Personal Civilization Builder",
    description:
      "Build your own capability civilization. From skills to buildings, from buildings to civilizations — your learning becomes a world you can see.",
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
      <body className="min-h-screen bg-cartography-grid font-sans text-[oklch(0.25_0.01_90)] antialiased transition-colors duration-300">
        <Providers>
          <HtmlLang />
          <Navbar />
          <MainWrapper>
            <PageGlassWrapper>
              <ErrorBoundary>{children}</ErrorBoundary>
            </PageGlassWrapper>
          </MainWrapper>
          <AgentSidebar />
        </Providers>
      </body>
    </html>
  );
}
