import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "SIDRA — Smart Home",
  description: "A modern Home Assistant dashboard.",
};

export const viewport: Viewport = {
  themeColor: "#070b16",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Providers (React Query + realtime) wrap everything; the dashboard
            shell lives in the (app) route group so /login can render bare. */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
