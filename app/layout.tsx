import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AOM SG | AOM Scholar guide",
  description: "Your guide to membership, publishing, and conferences. Independent AOM prototype.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: [
      { url: "/aom-icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/aom-icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/aom-icon-32.png",
    apple: "/aom-apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
