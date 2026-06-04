import { createServerSupabaseClient } from "@/lib/supabase/server";
import GalleryClient from "./GalleryClient";

export default async function AdminGalleryPage() {
  const supabase = await createServerSupabaseClient();
  const { data: posts } = await supabase
    .from("instagram_posts")
    .select("*")
    .order("posted_at", { ascending: false });

  return <GalleryClient posts={posts ?? []} />;
}
