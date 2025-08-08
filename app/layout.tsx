import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TranslNathan - Professional Hebrew-English AI Translation Editor",
  description: "Professional Hebrew-English AI translation editor with style awareness, reference material integration, and advanced readability analysis. Built for translators and content creators.",
  keywords: "Hebrew translation, English translation, AI translation, professional translation, style-aware translation, readability analysis",
  authors: [{ name: "TranslNathan Team" }],
  openGraph: {
    title: "TranslNathan - Hebrew-English AI Translation Editor",
    description: "Professional translation editing with AI assistance, style awareness, and readability analysis",
    type: "website",
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
