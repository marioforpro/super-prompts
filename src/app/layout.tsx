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
    title: "Super Prompts — NEVER LOSE A GREAT PROMPT AGAIN",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var theme = localStorage.getItem('sp-theme') || 'dark';
            document.documentElement.setAttribute('data-theme', theme);
          })();
        `}} />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
