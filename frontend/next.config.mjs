/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Proxy /api to the FastAPI backend during development
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
      {
        source: "/static/:path*",
        destination: "http://localhost:8000/static/:path*",
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
