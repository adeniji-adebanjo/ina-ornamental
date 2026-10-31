import { baseOpenGraph } from "@/app/shared-metadata";
import { fetchPostBySlug } from "@/lib/blog";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArrowLeft, CalendarDays } from "lucide-react";

export const revalidate = 300;

// Memoise so generateMetadata and the page share a single fetch.
const getPost = cache((slug: string) => fetchPostBySlug(slug));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Article not found" };

  const description =
    post.excerpt || `Read "${post.title}" on the INÁ Ornamental Fish blog.`;
  return {
    title: post.title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      ...baseOpenGraph,
      type: "article",
      title: post.title,
      description,
      url: `/blog/${post.slug}`,
      publishedTime: post.date || undefined,
      modifiedTime: post.modified || undefined,
      images: post.featuredImageUrl
        ? [{ url: post.featuredImageUrl }]
        : baseOpenGraph.images,
    },
  };
}

function formatDate(iso: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <article className="bg-[#fdfbf7]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-800 hover:text-sky-900 mb-8"
        >
          <ArrowLeft className="size-4" />
          Back to blog
        </Link>

        <header className="mb-8">
          {post.categories[0] && (
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
              {post.categories[0].name}
            </span>
          )}
          <h1 className="text-3xl md:text-4xl font-black text-sky-900 mt-3 mb-4 leading-tight">
            {post.title}
          </h1>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CalendarDays className="size-4" />
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            {post.authorName && <span>· {post.authorName}</span>}
          </div>
        </header>

        {post.featuredImageUrl && (
          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-slate-100 mb-10">
            <Image
              src={post.featuredImageUrl}
              alt={post.featuredImageAlt || post.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        )}

        <div
          className="prose-ina max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="mt-12 pt-8 border-t border-slate-200">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-800 hover:text-sky-900"
          >
            <ArrowLeft className="size-4" />
            Back to all articles
          </Link>
        </div>
      </div>
    </article>
  );
}
