"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SpeciesWithImages, Category } from "@/types/database";
import { Button } from "@/components/ui/button";
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

export default function SpeciesListClient({ species, categories }: Props) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [seeding, setSeeding] = useState(false);
  const router = useRouter();
  const [confirmProps, showConfirm] = useConfirmDialog();

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
          toast.error("Failed to delete species");
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

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Species
        </h1>
        <Link href="/admin/species/new" className="w-full sm:w-auto">
          <Button className="rounded-xl w-full sm:w-auto">
            <Plus className="size-4 mr-2" />
            Add Species
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            placeholder="Search species..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
        <select
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
              <Link href="/admin/species/new">
                <Button className="rounded-xl">
                  <Plus className="size-4 mr-2" />
                  Add Species
                </Button>
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
                <div className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
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
                </div>

                <div className="hidden sm:flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {s.category?.name ?? "—"}
                  </Badge>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${availabilityBadge(s.availability)}`}
                  >
                    {s.availability.replace("_", " ")}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Link href={`/admin/species/${s.id}`}>
                    <Button variant="ghost" size="icon-sm">
                      <Pencil className="size-4 text-slate-500" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon-sm"
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
