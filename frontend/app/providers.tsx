"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initRealtime } from "@/lib/socket";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());

  useEffect(() => {
    // Open the Socket.IO connection once on mount and stream live state.
    initRealtime();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
