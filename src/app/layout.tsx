import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Attribution } from "@/components/Attribution";
import "./globals.css";
import "@xyflow/react/dist/style.css";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NextFlow",
  description: "A visual LLM workflow builder",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} h-full antialiased`}>
        <head>
          <link rel="stylesheet" href="/css/uppy-core.css" />
          <link rel="stylesheet" href="/css/uppy-dashboard.css" />
        </head>
        <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
          <Attribution />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
