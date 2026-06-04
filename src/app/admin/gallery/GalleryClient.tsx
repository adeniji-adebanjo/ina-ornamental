"use client";

import { useState } from "react";
import type { InstagramPost } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RefreshCw, Camera, ExternalLink } from "lucide-react";

export default function GalleryClient({
  posts: initial,
}: {
  posts: InstagramPost[];
}) {
  const [posts, setPosts] = useState(initial);
  const [syncing, setSyncing] = useState(false);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/instagram/sync", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Synced ${data.count} posts from Instagram`);
        // Reload to get fresh data
        window.location.reload();
      } else {
        const data = await res.json();
        toast.error(data.error || "Sync failed");
      }
    } catch {
      toast.error("Network error during sync");
    }
    setSyncing(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Instagram Gallery
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {posts.length} posts cached
          </p>
        </div>
        <Button
          onClick={handleSync}
          disabled={syncing}
          className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400"
        >
          <RefreshCw
            className={`size-4 mr-2 ${syncing ? "animate-spin" : ""}`}
          />
          {syncing ? "Syncing..." : "Sync from Instagram"}
        </Button>
      </div>

      {posts.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="p-12 text-center">
            <Camera className="size-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-700">
              No Posts Yet
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Click &quot;Sync from Instagram&quot; to fetch your latest posts.
              Make sure INSTAGRAM_ACCESS_TOKEN is configured.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {posts.map((post) => (
            <Card key={post.id} className="rounded-xl overflow-hidden group">
              <div className="aspect-square bg-slate-100 overflow-hidden relative">
                {post.media_type === "VIDEO" ? (
                  <video
                    src={post.media_url}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : (
                  <img
                    src={post.media_url}
                    alt={post.caption ?? "Instagram post"}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <a
                    href={post.permalink ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white flex items-center gap-1 text-sm"
                  >
                    <ExternalLink className="size-4" /> View on Instagram
                  </a>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="text-xs text-slate-600 line-clamp-2">
                  {post.caption ?? "No caption"}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <Badge variant="outline" className="text-xs">
                    {post.media_type}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    {new Date(post.posted_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
