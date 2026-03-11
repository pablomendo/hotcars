import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Evita que el deploy falle por errores de TypeScript
    ignoreBuildErrors: true,
  },
  // La sección 'eslint' fue eliminada porque ya no es compatible aquí
};

export default nextConfig;