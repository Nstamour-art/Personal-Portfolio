/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    /* Allow next/image to optimise assets served from our GitHub repo's
     * raw content host. Keystatic Cloud serves uploaded images from
     * raw.githubusercontent.com between the moment they're committed and
     * the moment Vercel finishes rebuilding — without this entry, the
     * admin preview and any image referenced before redeploy completes
     * would return a 400 from the image optimiser.
     *
     * Scoped to the project's own repo so /_next/image can't be used as
     * an open proxy for arbitrary GitHub content. */
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/Nstamour-art/Personal-Portfolio/**',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
};

export default nextConfig;
