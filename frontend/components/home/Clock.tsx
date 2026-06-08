"use client";

import { useEffect, useState } from "react";

export function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return <div className="h-20" />;

  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const date = now
    .toLocaleDateString([], { weekday: "short", month: "short", day: "2-digit" })
    .toUpperCase();

  return (
    <div className="mt-3">
      <p className="text-5xl font-bold tracking-tight text-muted sm:text-6xl">{time}</p>
      <p className="mt-1 text-sm font-semibold tracking-[0.3em] text-muted">{date}</p>
    </div>
  );
}
