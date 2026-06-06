"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  SpeciesWithImages,
  Category,
  AvailabilityStatus,
} from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Props {
  species?: SpeciesWithImages;
  categories: Category[];
}

const AVAILABILITY_OPTIONS: { value: AvailabilityStatus; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "limited_stock", label: "Limited Stock" },
  { value: "out_of_stock", label: "Out of Stock" },
  { value: "seasonal", label: "Seasonal" },
  { value: "on_request", label: "On Request" },
];

export default function SpeciesFormClient({ species, categories }: Props) {
  const router = useRouter();
  const isEdit = !!species;

  const [form, setForm] = useState({
    common_name: species?.common_name ?? "",
    scientific_name: species?.scientific_name ?? "",
    slug: species?.slug ?? "",
    category_id: species?.category_id ?? "",
    class_order: species?.class_order ?? "",
    description: species?.description ?? "",
    origin: species?.origin ?? "West Africa",
    sizes: species?.sizes?.join(", ") ?? "",
    tags: species?.tags?.join(", ") ?? "",
    qty_per_box: species?.qty_per_box ?? 1,
    availability: species?.availability ?? ("available" as AvailabilityStatus),
    featured: species?.featured ?? false,
    best_seller: species?.best_seller ?? false,
    sort_order: species?.sort_order ?? 0,
  });

  const [imageUrls, setImageUrls] = useState<string[]>(
    species?.images?.map((i) => i.image_url) ?? [],
  );
  const [newImageUrl, setNewImageUrl] = useState("");
  const [saving, setSaving] = useState(false);

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleNameChange(name: string) {
    setForm((f) => ({
      ...f,
      common_name: name,
      slug: isEdit ? f.slug : slugify(name),
    }));
  }

  function addImage() {
    if (!newImageUrl.trim()) return;
    setImageUrls((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl("");
  }

  function removeImage(index: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const body = {
      ...form,
      sizes: form.sizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      category_id: form.category_id || null,
      image_urls: imageUrls,
    };

    const url = isEdit
      ? `/api/admin/species/${species.id}`
      : "/api/admin/species";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      toast.success(isEdit ? "Species updated" : "Species created");
      router.push("/admin/species");
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error || "Failed to save");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <Link
        href="/admin/species"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-sky-700 mb-4"
      >
        <ArrowLeft className="size-4" />
        Back to Species
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="rounded-xl">
            <CardContent className="p-4 sm:p-5 space-y-4">
              <h2 className="font-semibold text-slate-900">Basic Info</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Common Name *
                  </label>
                  <Input
                    required
                    value={form.common_name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Scientific Name
                  </label>
                  <Input
                    value={form.scientific_name}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        scientific_name: e.target.value,
                      }))
                    }
                    className="rounded-xl italic"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Slug
                  </label>
                  <Input
                    required
                    value={form.slug}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, slug: e.target.value }))
                    }
                    className="rounded-xl font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Category
                  </label>
                  <select
                    value={form.category_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category_id: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  >
                    <option value="">— None —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Class/Order
                  </label>
                  <Input
                    value={form.class_order}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, class_order: e.target.value }))
                    }
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Origin
                  </label>
                  <Input
                    value={form.origin}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, origin: e.target.value }))
                    }
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Description
                </label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={4}
                  className="rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Sizes (comma-separated)
                  </label>
                  <Input
                    value={form.sizes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, sizes: e.target.value }))
                    }
                    placeholder="Small, Medium, Large"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Tags (comma-separated)
                  </label>
                  <Input
                    value={form.tags}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, tags: e.target.value }))
                    }
                    placeholder="Monster Fish, Aggressive"
                    className="rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card className="rounded-xl">
            <CardContent className="p-4 sm:p-5 space-y-4">
              <h2 className="font-semibold text-slate-900">Images</h2>

              {imageUrls.map((url, i) => (
                <div key={i} className="flex items-center gap-2 sm:gap-3">
                  <img
                    src={url}
                    alt=""
                    className="w-10 h-10 sm:w-16 sm:h-16 rounded-lg object-cover border shrink-0"
                  />
                  <Input
                    value={url}
                    onChange={(e) => {
                      const updated = [...imageUrls];
                      updated[i] = e.target.value;
                      setImageUrls(updated);
                    }}
                    className="flex-1 min-w-0 rounded-xl text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeImage(i)}
                  >
                    <Trash2 className="size-4 text-red-500" />
                  </Button>
                </div>
              ))}

              <div className="flex gap-2">
                <Input
                  placeholder="Paste image URL..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="rounded-xl text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addImage}
                  className="rounded-xl"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="rounded-xl">
            <CardContent className="p-5 space-y-4">
              <h2 className="font-semibold text-slate-900">Status</h2>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Availability
                </label>
                <select
                  value={form.availability}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      availability: e.target.value as AvailabilityStatus,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                >
                  {AVAILABILITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Qty per Box
                </label>
                <Input
                  type="number"
                  min={1}
                  value={form.qty_per_box}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      qty_per_box: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Sort Order
                </label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      sort_order: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, featured: e.target.checked }))
                    }
                    className="rounded"
                  />
                  Featured Species
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.best_seller}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, best_seller: e.target.checked }))
                    }
                    className="rounded"
                  />
                  Best Seller
                </label>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={saving}
            className="w-full h-11 rounded-xl font-semibold"
          >
            {saving
              ? "Saving..."
              : isEdit
                ? "Update Species"
                : "Create Species"}
          </Button>
        </div>
      </div>
    </form>
  );
}
