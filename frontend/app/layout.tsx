import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Job Tracker",
  description: "Track your job applications from Gmail",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Job Tracker",
  },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} dark h-full`}>
      <body className="min-h-full flex flex-col bg-mesh">
        <NavBar />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto w-full pb-24 md:pb-8">
          {children}
        </main>
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: "rgba(24, 24, 27, 0.9)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#fafafa",
              backdropFilter: "blur(12px)",
            },
          }}
        />
      </body>
    </html>
  );
}
