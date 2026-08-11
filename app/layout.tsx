import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TMWC Youth Site",
  description: "Clean rebuild shell for the TMWC Youth website.",
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
