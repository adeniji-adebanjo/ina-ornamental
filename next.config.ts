import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so Next does not infer it from a parent lockfile.
  turbopack: {
    root: import.meta.dirname,
  },
  // Don't advertise the framework.
  poweredByHeader: false,
  images: {
    // Image optimisation (sharp) is the heaviest CPU work this server does.
    // Product photos rarely change and a replaced photo gets a new URL, so
    // keep optimised variants for 30 days (Next 16 default: 4 hours), and
    // don't generate 2048/3840px variants nobody needs for a fish thumbnail.
    // Formats stay at the default (WebP only); AVIF encoding is far costlier.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    remotePatterns: [
      {
        // WordPress media kept on the apex (served by Nginx from /wp-content/uploads).
        protocol: "https",
        hostname: "inaornamentalfish.com",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "www.inaornamentalfish.com",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "*.inaornamentalfish.com",
      },
      {
        // Headless WordPress CMS (blog posts + media library).
        protocol: "https",
        hostname: "cms.inaornamental.com",
      },
      {
        protocol: "https",
        hostname: "i0.wp.com",
      },
      {
        protocol: "https",
        hostname: "secure.gravatar.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
      },
      {
        protocol: "https",
        hostname: "*.cdninstagram.com",
      },
      {
        protocol: "https",
        hostname: "scontent.cdninstagram.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "*.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "drive.google.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
