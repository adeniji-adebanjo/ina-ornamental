"use client";

import InstagramSidebar from "@/components/blog/InstagramSidebar";
import type { BlogCategory, BlogPost } from "@/types";
import type { InstagramPost } from "@/types/database";
import { CalendarDays, Newspaper, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

interface Props {
  posts: BlogPost[];
  categories: BlogCategory[];
  instagramPosts: InstagramPost[];
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

export default function BlogIndexClient({
  posts,
  categories,
  instagramPosts,
}: Props) {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<number | "all">("all");

  // Only show categories that actually have posts in the loaded set.
  const usedCategories = useMemo(() => {
    const ids = new Set(posts.flatMap((p) => p.categories.map((c) => c.id)));
    return categories.filter((c) => ids.has(c.id));
  }, [posts, categories]);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const matchSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.excerpt.toLowerCase().includes(search.toLowerCase());
      const matchCat =
        activeCat === "all" ||
        p.categories.some((c) => c.id === activeCat);
      return matchSearch && matchCat;
    });
  }, [posts, search, activeCat]);

  return (
    <div className="bg-[#fdfbf7]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <Image
          src="/blog-hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-br from-slate-900/90 via-sky-900/75 to-emerald-900/70" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300 mb-3">
            From the team
          </p>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4">
            The INA Journal
          </h1>
          <p className="text-sky-100 max-w-2xl mx-auto md:text-lg">
            Care guides, species spotlights and stories from the world of West
            African ornamental fish.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8 lg:items-start">
          <div>
        {posts.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-10">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles…"
                className="w-full pl-9 pr-3 py-2.5 rounded-full border border-slate-200 bg-white text-sm outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/40"
              />
            </div>
            {usedCategories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveCat("all")}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeCat === "all"
                      ? "bg-sky-800 text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  All
                </button>
                {usedCategories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCat(c.id)}
                    className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      activeCat === c.id
                        ? "bg-sky-800 text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center text-center py-20">
            <Newspaper className="size-14 text-slate-300 mb-4" />
            <h2 className="text-xl font-bold text-slate-700 mb-2">
              {posts.length === 0
                ? "No articles yet"
                : "No matching articles"}
            </h2>
            <p className="text-slate-500 max-w-sm">
              {posts.length === 0
                ? "We're working on our first stories — check back soon."
                : "Try a different search or category."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            {filtered.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                  {post.featuredImageUrl ? (
                    <Image
                      src={post.featuredImageUrl}
                      alt={post.featuredImageAlt || post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Newspaper className="size-10" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col flex-1 p-5">
                  {post.categories[0] && (
                    <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600 mb-2">
                      {post.categories[0].name}
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-slate-900 leading-snug mb-2 group-hover:text-sky-800 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-sm text-slate-500 line-clamp-3 mb-4">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="mt-auto flex items-center gap-1.5 text-xs text-slate-400">
                    <CalendarDays className="size-3.5" />
                    {formatDate(post.date)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
          </div>

          {instagramPosts.length > 0 && (
            <aside className="mt-10 lg:mt-0 lg:sticky lg:top-24">
              <InstagramSidebar posts={instagramPosts} />
            </aside>
          )}
        </div>
      </section>
    </div>
  );
}
