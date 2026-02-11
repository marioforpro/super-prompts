import type { Metadata } from "next";
import "./globals.css";

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
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
