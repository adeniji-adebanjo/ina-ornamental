"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, UploadCloud } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Manages a list of image URLs, with the ability to upload files directly to
 * the WordPress media library (via /api/admin/media) or paste an existing URL.
 * Controlled via {value, onChange} so it drops into any admin form.
 */
interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
}

export default function ImageUploader({ value, onChange }: Props) {
  const [newUrl, setNewUrl] = useState("");
  const [uploading, setUploading] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadOne(file: File): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/media", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error || `Failed to upload ${file.name}`);
      return null;
    }
    return data.source_url as string;
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith("image/"),
    );
    e.target.value = "";
    if (!files.length) return;
    setUploading(files.length);
    try {
      const results = await Promise.all(files.map(uploadOne));
      const urls = results.filter(Boolean) as string[];
      if (urls.length) {
        onChange([...value, ...urls]);
        toast.success(
          `Uploaded ${urls.length} image${urls.length > 1 ? "s" : ""} to the media library`,
        );
      }
    } finally {
      setUploading(0);
    }
  }

  function addUrl() {
    const url = newUrl.trim();
    if (!url) return;
    onChange([...value, url]);
    setNewUrl("");
  }

  function updateUrl(index: number, url: string) {
    onChange(value.map((u, i) => (i === index ? url : u)));
  }

  function removeUrl(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      {value.map((url, i) => (
        <div key={i} className="flex items-center gap-2 sm:gap-3">
          <div className="relative w-10 h-10 sm:w-16 sm:h-16 rounded-lg overflow-hidden border shrink-0 bg-slate-50">
            {url ? (
              <Image
                src={url}
                alt=""
                fill
                sizes="64px"
                unoptimized
                className="object-cover"
              />
            ) : null}
          </div>
          <Input
            value={url}
            onChange={(e) => updateUrl(i, e.target.value)}
            className="flex-1 min-w-0 rounded-xl text-sm"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => removeUrl(i)}
          >
            <Trash2 className="size-4 text-red-500" />
          </Button>
        </div>
      ))}

      {/* Upload to the WordPress media library */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading > 0}
        className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-6 text-slate-500 hover:bg-slate-50 disabled:opacity-60"
      >
        {uploading > 0 ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <UploadCloud className="size-5" />
        )}
        <span className="text-sm font-medium">
          {uploading > 0
            ? `Uploading ${uploading} image${uploading > 1 ? "s" : ""}…`
            : "Upload images"}
        </span>
        <span className="text-xs text-slate-400">
          Saved to the WordPress media library
        </span>
      </button>

      {/* Or paste an existing URL */}
      <div className="flex gap-2">
        <Input
          placeholder="…or paste an image URL"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addUrl();
            }
          }}
          className="rounded-xl text-sm"
        />
        <Button
          type="button"
          variant="outline"
          onClick={addUrl}
          className="rounded-xl"
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}
