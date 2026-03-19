"use client";

import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <HeroUIProvider>
        {children}
        <ToastProvider placement="bottom-right" />
      </HeroUIProvider>
    </SessionProvider>
  );
}
