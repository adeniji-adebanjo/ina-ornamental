"use client";

import { useState } from "react";
import type { InstagramPost } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, ExternalLink } from "lucide-react";

export default function GalleryPageClient({
  posts,
}: {
  posts: InstagramPost[];
}) {
  const [selected, setSelected] = useState<InstagramPost | null>(null);

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-sky-900 via-sky-800 to-emerald-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Camera className="size-8" />
            <h1 className="text-3xl md:text-4xl font-bold">Our Gallery</h1>
          </div>
          <p className="text-sky-200 max-w-lg mx-auto">
            Explore our collection of premium ornamental fish, straight from
            Indonesia&apos;s finest waters.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <Camera className="size-16 text-slate-200 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-600">
              Gallery coming soon
            </h2>
            <p className="text-slate-400 mt-2">
              Follow us on Instagram for the latest updates.
            </p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
            {posts.map((post, idx) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
                className="mb-4 break-inside-avoid cursor-pointer group relative rounded-xl overflow-hidden"
                onClick={() => setSelected(post)}
              >
                {post.media_type === "VIDEO" ? (
                  <video
                    src={post.media_url}
                    className="w-full rounded-xl"
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={post.media_url}
                    alt={post.caption ?? "Gallery image"}
                    className="w-full rounded-xl"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white text-sm line-clamp-2">
                      {post.caption}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-3xl w-full bg-white rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                {selected.media_type === "VIDEO" ? (
                  <video
                    src={selected.media_url}
                    className="w-full max-h-[70vh] object-contain bg-black"
                    controls
                    autoPlay
                    muted
                  />
                ) : (
                  <img
                    src={selected.media_url}
                    alt={selected.caption ?? ""}
                    className="w-full max-h-[70vh] object-contain bg-black"
                  />
                )}
                <button
                  onClick={() => setSelected(null)}
                  className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="p-5">
                <p className="text-slate-700 text-sm">{selected.caption}</p>
                <div className="flex items-center justify-between mt-3">
                  <Badge variant="outline" className="text-xs">
                    {new Date(selected.posted_at).toLocaleDateString()}
                  </Badge>
                  <a
                    href={selected.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-sky-700 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="size-3" /> View on Instagram
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
