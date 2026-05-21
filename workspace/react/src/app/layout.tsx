import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Omatcha",
  description: "Matching app web test product",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Omatcha",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/matcha/manifest.webmanifest",
};

export const viewport: Viewport = {
  initialScale: 1,
  themeColor: "#111111",
  viewportFit: "cover",
  width: "device-width",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
