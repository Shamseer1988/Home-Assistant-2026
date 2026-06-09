"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { AppShell } from "@/components/layout/AppShell";

// The entire dashboard requires login; unauthenticated visitors go to /login.
export default function AppGroupLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-sidra-sky" />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
