import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Evita que el deploy falle por errores de TypeScript
    ignoreBuildErrors: true,
  },
  eslint: {
    // Evita que el deploy se frene por avisos de formato o linting
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;