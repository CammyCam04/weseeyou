import type { Metadata } from "next";
import "./globals.scss";

export const metadata: Metadata = {
  title: "We See You | U.S. Politicians & Government Transparency",
  description: "Track U.S. national, state, and local political leaders, campaign finance, and official legislation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
