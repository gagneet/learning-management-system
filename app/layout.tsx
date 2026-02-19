import type { Metadata } from "next";
import "./globals.css";
import { lexend, inter, atkinson } from "./fonts";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "AetherLearn - Learning Management System",
  description: "A comprehensive LMS for managing courses, users, and learning content with gamification, academic intelligence, and multi-centre management",
  icons: {
    icon: '/aetherlearn-favicon.ico',
    apple: '/aetherlearn-favicon.png',
    shortcut: '/aetherlearn-favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${lexend.variable} ${inter.variable} ${atkinson.variable}`}
    >
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        >
          Skip to content
        </a>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
