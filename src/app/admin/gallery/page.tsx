import { createAdminSupabaseClient } from "@/lib/supabase/server";
import GalleryClient from "./GalleryClient";

export default async function AdminGalleryPage() {
  const supabase = await createAdminSupabaseClient();
  const { data: posts } = await supabase
    .from("instagram_posts")
    .select("*")
    .order("timestamp", { ascending: false });

  return <GalleryClient posts={posts ?? []} />;
}
