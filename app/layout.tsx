import type { Metadata } from "next";
import "./globals.css";
import { lexend, inter, atkinson } from "./fonts";

export const metadata: Metadata = {
  title: "Learning Management System",
  description: "A comprehensive LMS for managing courses, users, and learning content",
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
        {children}
      </body>
    </html>
  );
}
