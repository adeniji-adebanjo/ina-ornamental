import { fetchCategories, fetchPostById, isBlogWritable } from "@/lib/blog";
import { notFound, redirect } from "next/navigation";
import BlogEditorClient from "../BlogEditorClient";

export const dynamic = "force-dynamic";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isBlogWritable()) redirect("/admin/blog");
  const { id } = await params;

  const [post, categories] = await Promise.all([
    fetchPostById(Number(id)),
    fetchCategories({ fresh: true }),
  ]);

  if (!post) notFound();

  return <BlogEditorClient post={post} categories={categories} />;
}
