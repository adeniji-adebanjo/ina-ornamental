import { pageOpenGraph } from "@/app/shared-metadata";
import { fetchCategories, fetchPosts } from "@/lib/blog";
import { getInstagramPosts } from "@/lib/queries/instagram";
import BlogIndexClient from "./BlogIndexClient";

export const metadata = {
  title: "Blog",
  description:
    "News, care guides and stories from INÁ Ornamental Fish — West African ornamental fish exporters.",
  alternates: { canonical: "/blog" },
  openGraph: pageOpenGraph({
    title: "Blog | INÁ Ornamental Fish",
    description:
      "News, care guides and stories from INÁ Ornamental Fish — West African ornamental fish exporters.",
    url: "/blog",
  }),
};

// Revalidate the listing periodically so newly published posts appear.
export const revalidate = 300;

export default async function BlogPage() {
  const [{ posts }, categories, instagramPosts] = await Promise.all([
    fetchPosts({ perPage: 24 }),
    fetchCategories(),
    getInstagramPosts(9),
  ]);

  return (
    <BlogIndexClient
      posts={posts}
      categories={categories}
      instagramPosts={instagramPosts}
    />
  );
}
