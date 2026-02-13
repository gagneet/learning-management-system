import type { Metadata } from "next";
import "./globals.css";
import { lexend, inter, atkinson } from "./fonts";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Aether Learn - Learning Management System",
  description: "A comprehensive LMS for managing courses, users, and learning content",
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
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
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
