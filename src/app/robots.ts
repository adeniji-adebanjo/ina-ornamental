import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://inaornamentalfish.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private (token-gated client price lists), auth, and utility routes.
        disallow: ["/api/", "/admin/", "/login", "/orders/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
