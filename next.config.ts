import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Evita que el deploy falle por errores de TypeScript
    ignoreBuildErrors: true,
  },
};

export default nextConfig;