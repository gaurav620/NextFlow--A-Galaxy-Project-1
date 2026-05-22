import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Attribution } from "@/components/Attribution";
import { ThemeProvider } from "@/components/ThemeProvider";
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
      <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
        <head>
          <link rel="stylesheet" href="/css/uppy-core.css" />
          <link rel="stylesheet" href="/css/uppy-dashboard.css" />
          {/* Prevent theme flash — apply dark class before first paint */}
          <script
            dangerouslySetInnerHTML={{
              __html: `try{if(localStorage.getItem("nf-theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`,
            }}
          />
        </head>
        <body className="min-h-full flex flex-col bg-neutral-50 dark:bg-[#08080a] text-neutral-900 dark:text-zinc-100 transition-colors duration-300">
          <ThemeProvider>
            <Attribution />
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

