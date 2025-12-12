import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Event Koi - The Future of Event Management",
  description: "Experience the future of event management with Event Koi. Streamlined, powerful, and built for you. Discover events, connect with friends, and organize amazing experiences.",
  keywords: ["events", "event management", "ticketing", "organizer", "RDBMS"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        {children}
      </body>
    </html>
  );
}
