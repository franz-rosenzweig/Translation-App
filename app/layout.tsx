import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Type3 Translation‑Editing",
  description: "Edit AI‑translated Hebrew → American English with Type 3 rules"
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
