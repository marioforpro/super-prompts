import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Super Prompts — Your Creative Prompt Library",
  description:
    "The visual prompt library for creatives. Save prompts from anywhere, organize with previews, and discover what's trending — for Midjourney, Runway, Kling, Sora, and more.",
  keywords: [
    "prompt manager",
    "AI prompts",
    "Midjourney",
    "Runway",
    "Kling",
    "Sora",
    "creative tools",
    "prompt library",
  ],
  openGraph: {
    title: "Super Prompts — Never Lose a Great Prompt Again",
    description:
      "The visual prompt library for creatives. Save, organize, and discover AI prompts.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
