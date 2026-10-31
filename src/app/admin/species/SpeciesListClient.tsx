"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  SpeciesWithImages,
  Category,
  AvailabilityStatus,
} from "@/types/database";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Star,
  Fish,
  Database,
  Upload,
  Download,
  ChevronDown,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  ConfirmDialog,
  useConfirmDialog,
} from "@/components/ui/confirm-dialog";

interface Props {
  species: SpeciesWithImages[];
  categories: Category[];
}

const AVAILABILITY_OPTIONS: { value: AvailabilityStatus; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "limited_stock", label: "Limited Stock" },
  { value: "out_of_stock", label: "Out of Stock" },
  { value: "seasonal", label: "Seasonal" },
  { value: "on_request", label: "On Request" },
];

export default function SpeciesListClient({ species, categories }: Props) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [seeding, setSeeding] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [confirmProps, showConfirm] = useConfirmDialog();
  // Inline availability editing — optimistic per-row override + in-flight id.
  const [availOverride, setAvailOverride] = useState<
    Record<string, AvailabilityStatus>
  >({});
  const [savingAvail, setSavingAvail] = useState<string | null>(null);

  const filtered = species.filter((s) => {
    const matchSearch =
      search.length === 0 ||
      s.common_name.toLowerCase().includes(search.toLowerCase()) ||
      (s.scientific_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      filterCategory === "all" || s.category_id === filterCategory;
    return matchSearch && matchCategory;
  });

  function handleDelete(id: string, name: string) {
    showConfirm({
      title: `Delete "${name}"?`,
      description:
        "This species will be permanently removed. This action cannot be undone.",
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        const res = await fetch(`/api/admin/species/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          toast.success(`"${name}" deleted`);
          router.refresh();
        } else {
          const err = await res.json().catch(() => null);
          toast.error(err?.error || `Couldn't delete "${name}". Please try again.`);
        }
      },
    });
  }

  const availabilityBadge = (status: string) => {
    const colors: Record<string, string> = {
      available: "bg-emerald-50 text-emerald-700",
      limited_stock: "bg-amber-50 text-amber-700",
      out_of_stock: "bg-red-50 text-red-700",
      seasonal: "bg-sky-50 text-sky-700",
      on_request: "bg-slate-50 text-slate-600",
    };
    return colors[status] || colors.on_request;
  };

  // Persist a new availability inline (no edit form). Optimistic, reverts on error.
  async function updateAvailability(
    id: string,
    value: AvailabilityStatus,
    previous: AvailabilityStatus,
  ) {
    if (value === previous) return;
    setAvailOverride((m) => ({ ...m, [id]: value }));
    setSavingAvail(id);
    try {
      const res = await fetch(`/api/admin/species/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: value }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "save failed");
      }
      const label =
        AVAILABILITY_OPTIONS.find((o) => o.value === value)?.label ?? value;
      toast.success(`Availability set to "${label}"`);
    } catch {
      setAvailOverride((m) => ({ ...m, [id]: previous })); // revert
      toast.error("Couldn't update availability. Please try again.");
    } finally {
      setSavingAvail(null);
    }
  }

  // Colored pill that is also a dropdown — change availability without the edit form.
  function availabilityControl(s: SpeciesWithImages, small: boolean) {
    const current = availOverride[s.id] ?? s.availability;
    const isSaving = savingAvail === s.id;
    return (
      <span
        className={`relative inline-flex items-center rounded-full font-medium ${availabilityBadge(
          current,
        )} ${small ? "text-[10px]" : "text-xs"}`}
      >
        <select
          value={current}
          disabled={isSaving}
          aria-label="Availability"
          title="Change availability"
          onChange={(e) =>
            updateAvailability(
              s.id,
              e.target.value as AvailabilityStatus,
              current,
            )
          }
          className={`appearance-none bg-transparent cursor-pointer rounded-full focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:opacity-60 ${
            small ? "pl-1.5 pr-4 py-0.5" : "pl-2 pr-5 py-0.5"
          }`}
        >
          {AVAILABILITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="bg-white text-slate-700">
              {o.label}
            </option>
          ))}
        </select>
        {isSaving ? (
          <Loader2
            className={`pointer-events-none absolute right-1 animate-spin opacity-70 ${
              small ? "size-2.5" : "size-3"
            }`}
          />
        ) : (
          <ChevronDown
            className={`pointer-events-none absolute right-1 opacity-60 ${
              small ? "size-2.5" : "size-3"
            }`}
          />
        )}
      </span>
    );
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          `Seeded ${data.species} species in ${data.categories} categories`,
        );
        router.refresh();
      } else {
        toast.error(data.error || "Failed to seed data");
      }
    } catch {
      toast.error("Failed to seed data");
    } finally {
      setSeeding(false);
    }
  }

  async function handleExport() {
    try {
      const res = await fetch("/api/admin/species/export");
      if (!res.ok) {
        toast.error("Failed to export species");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ina-species-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Network error — couldn't export species. Please try again.");
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/species/import", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          `Imported: ${data.created} created, ${data.updated} updated`,
        );
        if (data.errors?.length) {
          toast.warning(`${data.errors.length} row(s) had issues`, {
            description: data.errors.slice(0, 3).join("\n"),
          });
        }
        router.refresh();
      } else {
        toast.error(data.error || "Import failed");
      }
    } catch {
      toast.error("Network error during import");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Species
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={handleImport}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="rounded-xl w-full sm:w-auto"
          >
            <Upload className="size-4 mr-2" />
            {importing ? "Importing..." : "Import CSV / Excel"}
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className="rounded-xl w-full sm:w-auto"
          >
            <Download className="size-4 mr-2" />
            Export CSV
          </Button>
          <Link
            href="/admin/species/new"
            className={cn(buttonVariants(), "rounded-xl w-full sm:w-auto")}
          >
            <Plus className="size-4 mr-2" />
            Add Species
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            aria-label="Search species"
            placeholder="Search species..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
        <select
          aria-label="Filter by category"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 text-sm"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-slate-500 mb-4">
        {filtered.length} species found
      </p>

      {species.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <Fish className="size-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              No species yet
            </h3>
            <p className="text-sm text-slate-500 mb-6 max-w-sm">
              Get started by adding species manually or load sample data to
              explore the admin dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/admin/species/new"
                className={cn(buttonVariants(), "rounded-xl")}
              >
                <Plus className="size-4 mr-2" />
                Add Species
              </Link>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={handleSeed}
                disabled={seeding}
              >
                <Database className="size-4 mr-2" />
                {seeding ? "Seeding..." : "Load Sample Data"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <Card key={s.id} className="rounded-xl">
              <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-4">
                <div className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                  {s.images?.[0] ? (
                    <Image
                      src={s.images[0].image_url}
                      alt={s.common_name}
                      fill
                      sizes="56px"
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
                      No img
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <p className="font-semibold text-sm sm:text-base text-slate-900 truncate">
                      {s.common_name}
                    </p>
                    {s.featured && (
                      <Star className="size-3.5 text-amber-500 fill-amber-500" />
                    )}
                  </div>
                  <p className="text-xs sm:text-sm italic text-slate-500 truncate">
                    {s.scientific_name}
                  </p>
                  {/* Status — surfaced here on mobile (shown inline on sm+) */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1 sm:hidden">
                    {s.category?.name && (
                      <Badge variant="outline" className="text-[10px]">
                        {s.category.name}
                      </Badge>
                    )}
                    {availabilityControl(s, true)}
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {s.category?.name ?? "—"}
                  </Badge>
                  {availabilityControl(s, false)}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/admin/species/${s.id}`}
                    aria-label={`Edit ${s.common_name}`}
                    className={buttonVariants({
                      variant: "ghost",
                      size: "icon-sm",
                    })}
                  >
                    <Pencil className="size-4 text-slate-500" />
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${s.common_name}`}
                    onClick={() => handleDelete(s.id, s.common_name)}
                  >
                    <Trash2 className="size-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <ConfirmDialog {...confirmProps} />
    </div>
  );
}
