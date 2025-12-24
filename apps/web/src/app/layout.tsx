import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BASMA بسمة | Neural Voice Secretary",
  description: "AI-powered voice secretary for Saudi Arabia. Handle calls, appointments, and bookings with authentic Saudi dialect.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body style={{ direction: "ltr" }}>{children}</body>
    </html>
  );
}
