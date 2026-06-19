/** @type {import('next').NextConfig} */

const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // Proxy /api to the FastAPI backend during development
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/static/:path*",
        destination: `${backendUrl}/static/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      { source: "/goals", destination: "/paths", permanent: true },
      { source: "/goals/:id*", destination: "/paths/:id*", permanent: true },
      { source: "/credentials", destination: "/personal?tab=credentials", permanent: true },
      { source: "/badges", destination: "/personal?tab=badges", permanent: true },
      { source: "/passport", destination: "/personal?tab=overview", permanent: true },
      { source: "/profile", destination: "/personal?tab=overview", permanent: true },
    ];
  },
};

export default nextConfig;
