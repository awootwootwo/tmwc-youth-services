import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TMWC Youth Services",
  description:
    "Youth business ideas and service opportunities from The Master's Work Church.",
  icons: {
    icon: "/images/tmwc-logo.jpg",
    shortcut: "/images/tmwc-logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
