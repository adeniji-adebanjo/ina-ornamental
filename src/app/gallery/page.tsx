import { getInstagramPosts } from "@/lib/queries/instagram";
import GalleryPageClient from "./GalleryPageClient";

export const metadata = {
  title: "Gallery | iNA Ornamental Fish",
  description:
    "Browse our Instagram gallery of premium ornamental fish from Indonesia.",
};

// Render per-request so newly synced Instagram posts appear without a rebuild.
export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const posts = await getInstagramPosts();
  return <GalleryPageClient posts={posts} />;
}
