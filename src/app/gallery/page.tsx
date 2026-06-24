import { getInstagramPosts } from "@/lib/queries/instagram";
import GalleryPageClient from "./GalleryPageClient";

export const metadata = {
  title: "Gallery",
  description:
    "Browse our gallery of premium West African ornamental fish — bichirs, cichlids, tetras, puffers, catfish and exotic oddballs sourced from Nigeria.",
  alternates: { canonical: "/gallery" },
};

// Render per-request so newly synced Instagram posts appear without a rebuild.
export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const posts = await getInstagramPosts();
  return <GalleryPageClient posts={posts} />;
}
