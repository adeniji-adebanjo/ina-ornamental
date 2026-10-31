import type { Metadata } from "next";

// A page's `openGraph` replaces the root layout's object wholesale (it is not
// deep-merged), so per-page OG metadata spreads these shared fields to keep the
// site name, locale and default share image.
export const baseOpenGraph = {
  type: "website",
  locale: "en_US",
  siteName: "INÁ Ornamental Fish",
  images: [
    {
      url: "/icon-512.png",
      width: 512,
      height: 512,
      alt: "INÁ Ornamental Fish Logo",
    },
  ],
} satisfies Metadata["openGraph"];

export function pageOpenGraph(og: {
  title: string;
  description: string;
  url: string;
}): Metadata["openGraph"] {
  return { ...baseOpenGraph, ...og };
}
