/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  /* Esto ayuda a encontrar los archivos en src */
  experimental: {
    externalDir: true
  }
};
export default nextConfig;
