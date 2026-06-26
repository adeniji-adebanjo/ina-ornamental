"use client";

import RichTextEditor from "@/components/admin/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { BlogCategory, BlogPost, BlogStatus } from "@/types";
import { ArrowLeft, ImagePlus, Loader2, Save, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface Props {
  post?: BlogPost | null;
  categories: BlogCategory[];
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function uploadToWp(file: File): Promise<{ id: number; url: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/blog/media", {
    method: "POST",
    body: fd,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return { id: data.id, url: data.source_url };
}

export default function BlogEditorClient({ post, categories }: Props) {
  const router = useRouter();
  const isEdit = Boolean(post);

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post?.slug));
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [status, setStatus] = useState<BlogStatus>(post?.status ?? "draft");
  const [selectedCats, setSelectedCats] = useState<number[]>(
    post?.categories.map((c) => c.id) ?? [],
  );
  const [featuredId, setFeaturedId] = useState<number | null>(
    post?.featuredImageUrl ? -1 : null, // -1 = keep existing until changed
  );
  const [featuredUrl, setFeaturedUrl] = useState<string | null>(
    post?.featuredImageUrl ?? null,
  );
  const [featuredUploading, setFeaturedUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const featuredInputRef = useRef<HTMLInputElement>(null);

  function onTitleChange(v: string) {
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  function toggleCategory(id: number) {
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  async function handleFeaturedSelected(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFeaturedUploading(true);
    try {
      const { id, url } = await uploadToWp(file);
      setFeaturedId(id);
      setFeaturedUrl(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setFeaturedUploading(false);
    }
  }

  function removeFeatured() {
    setFeaturedId(0); // 0 tells WP to clear the featured image
    setFeaturedUrl(null);
  }

  async function handleSave(nextStatus: BlogStatus) {
    if (!title.trim()) {
      toast.error("Please add a title.");
      return;
    }
    setSaving(true);

    const payload: Record<string, unknown> = {
      title,
      content,
      excerpt,
      status: nextStatus,
      slug: slug || undefined,
      categories: selectedCats,
    };
    // featuredId: null = untouched/none, -1 = keep existing, 0 = clear, >0 = new
    if (featuredId === 0) payload.featured_media = isEdit ? null : undefined;
    else if (featuredId && featuredId > 0) payload.featured_media = featuredId;

    try {
      const res = await fetch(
        isEdit ? `/api/admin/blog/${post!.id}` : "/api/admin/blog",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (res.ok) {
        setStatus(nextStatus);
        toast.success(
          isEdit
            ? "Post saved"
            : nextStatus === "publish"
              ? "Post published"
              : "Draft created",
        );
        router.push("/admin/blog");
        router.refresh();
      } else {
        toast.error(data.error || "Failed to save post");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/admin/blog">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
            {isEdit ? "Edit post" : "New post"}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            className="rounded-xl"
            disabled={saving}
            onClick={() => handleSave("draft")}
          >
            Save draft
          </Button>
          <Button
            className="rounded-xl"
            disabled={saving}
            onClick={() => handleSave("publish")}
          >
            {saving ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Save className="size-4 mr-2" />
            )}
            {status === "publish" ? "Update" : "Publish"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Post title"
              className="rounded-xl h-10 text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Content
            </label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              onImageUpload={async (file) => (await uploadToWp(file)).url}
            />
          </div>
        </div>

        {/* Sidebar — pinned on large screens while the content column scrolls.
            self-start stops the grid cell stretching (sticky needs that); the
            inner cap lets the sidebar scroll on its own if it outgrows the
            viewport. top-20 clears the admin layout's sticky header. */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pb-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-800">Status</p>
            <div className="flex gap-2">
              {(["draft", "publish"] as BlogStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-sm capitalize transition-colors ${
                    status === s
                      ? "border-sky-300 bg-sky-50 text-sky-800"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {s === "publish" ? "Published" : "Draft"}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
            <label className="block text-sm font-semibold text-slate-800">
              Slug
            </label>
            <Input
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              placeholder="auto-generated-from-title"
              className="rounded-lg"
            />
            <p className="text-xs text-slate-400">
              Leave blank to let WordPress generate it.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
            <p className="text-sm font-semibold text-slate-800">
              Featured image
            </p>
            <input
              ref={featuredInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFeaturedSelected}
            />
            {featuredUrl ? (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100">
                <Image
                  src={featuredUrl}
                  alt="Featured"
                  fill
                  sizes="320px"
                  unoptimized
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={removeFeatured}
                  className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  title="Remove featured image"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => featuredInputRef.current?.click()}
                disabled={featuredUploading}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-8 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
              >
                {featuredUploading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <ImagePlus className="size-5" />
                )}
                <span className="text-xs">
                  {featuredUploading ? "Uploading…" : "Upload image"}
                </span>
              </button>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
            <p className="text-sm font-semibold text-slate-800">Categories</p>
            {categories.length === 0 ? (
              <p className="text-xs text-slate-400">
                No categories yet. Create them from the Blog list page.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {categories.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCats.includes(c.id)}
                      onChange={() => toggleCategory(c.id)}
                      className="rounded border-slate-300 text-sky-700 focus:ring-sky-500"
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
            <label className="block text-sm font-semibold text-slate-800">
              Excerpt
            </label>
            <Textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short summary shown in cards and search results."
              rows={4}
              className="rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
