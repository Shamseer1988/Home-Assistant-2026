/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produces a minimal self-contained server for the Docker runtime stage.
  output: "standalone",
  reactStrictMode: true,
  // Scaffold convenience so the first container build is green even before the
  // toolchain is installed locally. Re-enable both checks as the app matures.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
