import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CritiCo - Build Smarter. Stay Secure.",
  description: "We provide Full Stack Development, AI Automation, and Cyber Security solutions for the modern enterprise.",
  keywords: ["CritiCo", "Full Stack Development", "AI Automation", "Cyber Security", "Enterprise Solutions"],
  authors: [{ name: "CritiCo Team" }],
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "CritiCo - Build Smarter. Stay Secure.",
    description: "Full Stack Development, AI Automation, and Cyber Security solutions for the modern enterprise",
    siteName: "CritiCo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CritiCo - Build Smarter. Stay Secure.",
    description: "Full Stack Development, AI Automation, and Cyber Security solutions for the modern enterprise",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
