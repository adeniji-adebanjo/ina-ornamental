import type { InstagramPost } from "@/types/database";
import { Camera } from "lucide-react";
import Image from "next/image";

const INSTAGRAM_URL = "https://www.instagram.com/inaornamentalfish/";

/**
 * Compact Instagram feed shown alongside the blog. Each tile links out to the
 * original post; videos use their thumbnail. Renders nothing when there are no
 * usable posts so the blog layout collapses to a single column.
 */
export default function InstagramSidebar({
  posts,
}: {
  posts: InstagramPost[];
}) {
  const tiles = posts
    .map((p) => ({
      id: p.id,
      src: p.media_type === "VIDEO" ? p.thumbnail_url : p.media_url,
      permalink: p.permalink,
      caption: p.caption,
    }))
    .filter((t) => t.src)
    .slice(0, 9);

  if (tiles.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Camera className="size-4 text-sky-700" />
          From the Gallery
        </h3>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-sky-700 hover:text-sky-600"
        >
          Follow
        </a>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {tiles.map((t) => (
          <a
            key={t.id}
            href={t.permalink ?? INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="relative aspect-square rounded-lg overflow-hidden group bg-slate-100"
          >
            <Image
              src={t.src as string}
              alt={t.caption ?? "Instagram post"}
              fill
              sizes="120px"
              unoptimized
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </a>
        ))}
      </div>
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 block text-center text-xs font-medium text-slate-500 hover:text-sky-700"
      >
        @inaornamentalfish
      </a>
    </div>
  );
}
