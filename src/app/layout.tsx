import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "AgriLink - India's Agricultural Trade Infrastructure",
  description: "India's largest agricultural trade network connecting producers, buyers, exporters, wholesalers, FPOs, and logistics providers through a transparent and trusted digital marketplace.",
  keywords: ["AgriLink", "agriculture", "India", "trade", "marketplace", "farmers", "FPO", "exporters", "logistics"],
  authors: [{ name: "AgriLink" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "AgriLink - India's Agricultural Trade Infrastructure",
    description: "Connecting India's agricultural ecosystem through transparent digital trade",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
