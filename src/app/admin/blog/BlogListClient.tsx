"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ConfirmDialog,
  useConfirmDialog,
} from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import type { BlogCategory, BlogPost } from "@/types";
import {
  Eye,
  EyeOff,
  Newspaper,
  Pencil,
  Plus,
  Search,
  Tags,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import CategoryManager from "./CategoryManager";

interface Props {
  posts: BlogPost[];
  categories: BlogCategory[];
  writable: boolean;
}

export default function BlogListClient({ posts, categories, writable }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "publish" | "draft">(
    "all",
  );
  const [busyId, setBusyId] = useState<number | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [confirmProps, showConfirm] = useConfirmDialog();

  const filtered = posts.filter((p) => {
    const matchSearch =
      !search || p.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function formatDate(iso: string) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  }

  async function togglePublish(post: BlogPost) {
    setBusyId(post.id);
    const next = post.status === "publish" ? "draft" : "publish";
    try {
      const res = await fetch(`/api/admin/blog/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(next === "publish" ? "Post published" : "Post unpublished");
        router.refresh();
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setBusyId(null);
    }
  }

  function handleDelete(post: BlogPost) {
    showConfirm({
      title: `Delete "${post.title}"?`,
      description:
        "This post will be permanently deleted from WordPress. This cannot be undone.",
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        const res = await fetch(`/api/admin/blog/${post.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          toast.success(`"${post.title}" deleted`);
          router.refresh();
        } else {
          const data = await res.json().catch(() => ({}));
          toast.error(data.error || "Failed to delete post");
        }
      },
    });
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Blog</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setCategoriesOpen(true)}
            disabled={!writable}
            className="rounded-xl w-full sm:w-auto"
          >
            <Tags className="size-4 mr-2" />
            Categories
          </Button>
          <Link href="/admin/blog/new" className="w-full sm:w-auto">
            <Button
              disabled={!writable}
              className="rounded-xl w-full sm:w-auto"
            >
              <Plus className="size-4 mr-2" />
              New Post
            </Button>
          </Link>
        </div>
      </div>

      {!writable && (
        <Card className="rounded-xl mb-6 border-amber-200 bg-amber-50">
          <CardContent className="py-4 text-sm text-amber-800">
            <p className="font-semibold mb-1">WordPress writeback not configured</p>
            <p>
              Set <code className="font-mono">WP_API_URL</code>,{" "}
              <code className="font-mono">WP_USERNAME</code> and{" "}
              <code className="font-mono">WP_APP_PASSWORD</code> in your
              environment to enable creating and editing posts. The blog scaffold
              is ready and will light up automatically once these are present.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | "publish" | "draft")
          }
          className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="publish">Published</option>
          <option value="draft">Drafts</option>
        </select>
      </div>

      <p className="text-sm text-slate-500 mb-4">{filtered.length} post(s)</p>

      {posts.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <Newspaper className="size-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              No posts yet
            </h3>
            <p className="text-sm text-slate-500 mb-6 max-w-sm">
              {writable
                ? "Write your first article — it will appear on the public blog once published."
                : "Once WordPress writeback is configured, your posts will appear here."}
            </p>
            {writable && (
              <Link href="/admin/blog/new">
                <Button className="rounded-xl">
                  <Plus className="size-4 mr-2" />
                  New Post
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((post) => (
            <Card key={post.id} className="rounded-xl">
              <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-4">
                <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                  {post.featuredImageUrl ? (
                    <Image
                      src={post.featuredImageUrl}
                      alt={post.title}
                      fill
                      sizes="64px"
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Newspaper className="size-5" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm sm:text-base text-slate-900 truncate">
                    {post.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDate(post.date)}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        post.status === "publish"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {post.status === "publish" ? "Published" : "Draft"}
                    </span>
                    {post.categories.slice(0, 2).map((c) => (
                      <Badge
                        key={c.id}
                        variant="outline"
                        className="text-[10px]"
                      >
                        {c.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title={
                      post.status === "publish" ? "Unpublish" : "Publish"
                    }
                    disabled={busyId === post.id}
                    onClick={() => togglePublish(post)}
                  >
                    {post.status === "publish" ? (
                      <EyeOff className="size-4 text-slate-500" />
                    ) : (
                      <Eye className="size-4 text-emerald-600" />
                    )}
                  </Button>
                  <Link href={`/admin/blog/${post.id}`}>
                    <Button variant="ghost" size="icon-sm" title="Edit">
                      <Pencil className="size-4 text-slate-500" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Delete"
                    onClick={() => handleDelete(post)}
                  >
                    <Trash2 className="size-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CategoryManager
        open={categoriesOpen}
        onOpenChange={setCategoriesOpen}
        initialCategories={categories}
      />
      <ConfirmDialog {...confirmProps} />
    </div>
  );
}
