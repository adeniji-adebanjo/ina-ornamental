import { fetchCategories, fetchPosts } from "@/lib/blog";
import BlogIndexClient from "./BlogIndexClient";

export const metadata = {
  title: "Blog",
  description:
    "News, care guides and stories from INA Ornamental Fish — West African ornamental fish exporters.",
  alternates: { canonical: "/blog" },
};

// Revalidate the listing periodically so newly published posts appear.
export const revalidate = 300;

export default async function BlogPage() {
  const [{ posts }, categories] = await Promise.all([
    fetchPosts({ perPage: 24 }),
    fetchCategories(),
  ]);

  return <BlogIndexClient posts={posts} categories={categories} />;
}
