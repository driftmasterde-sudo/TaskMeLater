import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import StructuredData from "@/components/StructuredData";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://taskmelater.app"),
  title: "TaskMeLater — Card-Based Project Planner",
  description:
    "Lightweight, card-based project planner for managing feature ideas, bugs, and change requests across multiple projects. Built for solo entrepreneurs and small teams.",
  keywords: [
    "project planner",
    "task management",
    "card-based",
    "bug tracker",
    "feature tracker",
    "solo entrepreneur",
    "project management tool",
  ],
  authors: [{ name: "Firas Hattab" }],
  creator: "Firas Hattab",
  openGraph: {
    title: "TaskMeLater — Card-Based Project Planner",
    description:
      "Manage feature ideas, bugs, and change requests across multiple projects with a clean card-based interface.",
    type: "website",
    locale: "en_US",
    siteName: "TaskMeLater",
  },
  twitter: {
    card: "summary_large_image",
    title: "TaskMeLater — Card-Based Project Planner",
    description:
      "Manage feature ideas, bugs, and change requests across multiple projects with a clean card-based interface.",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const dark = localStorage.getItem('taskmelater-dark');
                if (dark === 'true' || (!dark && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="h-full overflow-hidden">
        <StructuredData />
        {children}
      </body>
    </html>
  );
}
