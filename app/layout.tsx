import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
