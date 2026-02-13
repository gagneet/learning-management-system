"use client";

/**
 * Providers Component
 *
 * Wraps the application with necessary context providers
 */

import { SessionProvider, useSession } from "next-auth/react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "./NotificationProvider";

function NotificationWrapper({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  return (
    <NotificationProvider userId={session?.user?.id}>
      {children}
    </NotificationProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <NotificationWrapper>
          {children}
        </NotificationWrapper>
      </ThemeProvider>
    </SessionProvider>
  );
}
