import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "INA Ornamental Fish",
    short_name: "INA",
    description:
      "Premium West African ornamental fish — B2B export with live arrival guarantee.",
    start_url: "/",
    display: "standalone",
    background_color: "#efe7d6",
    theme_color: "#3b6c5d",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
