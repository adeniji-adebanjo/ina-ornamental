import { fetchCategories, isBlogWritable } from "@/lib/blog";
import { redirect } from "next/navigation";
import BlogEditorClient from "../BlogEditorClient";

export const dynamic = "force-dynamic";

export default async function NewBlogPostPage() {
  if (!isBlogWritable()) redirect("/admin/blog");
  const categories = await fetchCategories({ fresh: true });
  return <BlogEditorClient categories={categories} />;
}
