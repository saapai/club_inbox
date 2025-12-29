import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Club Claims Inbox",
  description: "Transform messy inputs into structured, canonical truths",
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
