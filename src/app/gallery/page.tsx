import { createServerSupabaseClient } from "@/lib/supabase/server";
import GalleryPageClient from "./GalleryPageClient";

export const metadata = {
  title: "Gallery | iNA Ornamental Fish",
  description:
    "Browse our Instagram gallery of premium ornamental fish from Indonesia.",
};

export default async function GalleryPage() {
  const supabase = await createServerSupabaseClient();
  const { data: posts } = await supabase
    .from("instagram_posts")
    .select("*")
    .order("posted_at", { ascending: false });

  return <GalleryPageClient posts={posts ?? []} />;
}
