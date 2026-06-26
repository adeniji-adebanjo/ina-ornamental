import { fetchCategories, fetchPosts, isBlogWritable } from "@/lib/blog";
import BlogListClient from "./BlogListClient";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const writable = isBlogWritable();
  const [postsResult, categories] = await Promise.all([
    writable
      ? fetchPosts({ status: "any", perPage: 50 })
      : Promise.resolve({ posts: [], total: 0, totalPages: 0 }),
    writable ? fetchCategories({ fresh: true }) : Promise.resolve([]),
  ]);

  return (
    <BlogListClient
      posts={postsResult.posts}
      categories={categories}
      writable={writable}
    />
  );
}
