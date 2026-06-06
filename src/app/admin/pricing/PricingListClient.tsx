"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Upload,
  Download,
  Globe,
} from "lucide-react";
import {
  ConfirmDialog,
  useConfirmDialog,
} from "@/components/ui/confirm-dialog";

interface Species {
  id: string;
  common_name: string;
  scientific_name: string;
}

interface Client {
  id: string;
  name: string;
  company: string | null;
}

interface PriceItem {
  id: string;
  species_id: string;
  custom_price: number;
  species: { common_name: string; scientific_name: string } | null;
}

interface PriceList {
  id: string;
  client_id: string;
  slug: string;
  token: string;
  title: string;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  client: Client | null;
  items: PriceItem[];
}

export default function PricingListClient({
  priceLists: initial,
  clients,
  species,
  locations = [],
}: {
  priceLists: PriceList[];
  clients: Client[];
  species: Species[];
  locations?: string[];
}) {
  const router = useRouter();
  const [priceLists, setPriceLists] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [newItems, setNewItems] = useState<
    { species_id: string; custom_price: string }[]
  >([{ species_id: "", custom_price: "" }]);
  const [confirmProps, showConfirm] = useConfirmDialog();
  const fileRef = useRef<HTMLInputElement>(null);

  function addItemRow() {
    setNewItems((prev) => [...prev, { species_id: "", custom_price: "" }]);
  }

  function removeItemRow(idx: number) {
    setNewItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: string, value: string) {
    setNewItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    );
  }

  async function handleAutoFillFromLocation(location: string) {
    if (!location) return;
    setLoadingLocation(true);
    try {
      const res = await fetch(
        `/api/admin/location-pricing/by-location?location=${encodeURIComponent(location)}`,
      );
      if (res.ok) {
        const data: {
          species_id: string;
          size: string | null;
          price: number;
        }[] = await res.json();
        if (data.length === 0) {
          toast.info("No pricing data found for this location");
          setLoadingLocation(false);
          return;
        }
        // Group by species (take the first/generic price per species)
        const priceMap = new Map<string, number>();
        for (const row of data) {
          if (!priceMap.has(row.species_id)) {
            priceMap.set(row.species_id, row.price);
          }
        }
        const items = Array.from(priceMap.entries()).map(
          ([species_id, price]) => ({
            species_id,
            custom_price: price.toFixed(2),
          }),
        );
        setNewItems(items);
        toast.success(`Auto-filled ${items.length} species from "${location}"`);
      } else {
        toast.error("Failed to fetch location pricing");
      }
    } catch {
      toast.error("Network error");
    }
    setLoadingLocation(false);
  }

  async function handleBulkUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Parse the Excel file client-side to extract species + prices
    // We'll use a simple approach: read as FormData and send to a parse endpoint
    // For now, use the same format as location pricing but for a single list
    toast.info("Processing file...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/pricing/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setNewItems(
          data.items.map((i: { species_id: string; price: number }) => ({
            species_id: i.species_id,
            custom_price: i.price.toFixed(2),
          })),
        );
        toast.success(`Loaded ${data.items.length} species from file`);
        if (data.errors?.length) {
          toast.warning(`${data.errors.length} rows had issues`);
        }
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to parse file");
      }
    } catch {
      toast.error("Upload failed");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);

    const items = newItems
      .filter((i) => i.species_id && i.custom_price)
      .map((i) => ({
        species_id: i.species_id,
        custom_price: parseFloat(i.custom_price),
      }));

    if (items.length === 0) {
      toast.error("Add at least one species with a price");
      setSaving(false);
      return;
    }

    const body = {
      client_id: fd.get("client_id"),
      title: fd.get("title"),
      valid_from: fd.get("valid_from") || null,
      valid_until: fd.get("valid_until") || null,
      items,
    };

    const res = await fetch("/api/admin/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      toast.success("Price list created");
      setShowForm(false);
      setNewItems([{ species_id: "", custom_price: "" }]);
      router.refresh();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to create price list");
    }
    setSaving(false);
  }

  function handleDelete(id: string) {
    showConfirm({
      title: "Delete price list?",
      description:
        "This will permanently remove the price list and all its items.",
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        const res = await fetch(`/api/admin/pricing/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setPriceLists((prev) => prev.filter((p) => p.id !== id));
          toast.success("Price list deleted");
        } else {
          toast.error("Failed to delete");
        }
      },
    });
  }

  function copyLink(pl: PriceList) {
    const url = `${window.location.origin}/orders/${pl.slug}?token=${pl.token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Custom Pricing
        </h1>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="rounded-xl w-full sm:w-auto"
        >
          <Plus className="size-4 mr-2" /> New Price List
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6 rounded-xl border-sky-200">
          <CardContent className="p-4 sm:p-6">
            <h2 className="font-semibold text-lg mb-4">Create Price List</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Client
                  </label>
                  <select
                    name="client_id"
                    required
                    className="w-full rounded-xl border border-slate-200 h-10 px-3 text-sm"
                  >
                    <option value="">Select client...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.company ? `(${c.company})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  required
                  name="title"
                  placeholder="Price List Title"
                  className="rounded-xl mt-auto"
                />
                <Input
                  name="valid_from"
                  type="date"
                  className="rounded-xl"
                  placeholder="Valid From"
                />
                <Input
                  name="valid_until"
                  type="date"
                  className="rounded-xl"
                  placeholder="Valid Until"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Species & Custom Prices
                </label>

                {/* Auto-fill and upload options */}
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 mb-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {locations.length > 0 && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Globe className="size-4 text-sky-700 shrink-0" />
                      <select
                        onChange={(e) =>
                          handleAutoFillFromLocation(e.target.value)
                        }
                        disabled={loadingLocation}
                        className="rounded-lg border border-slate-200 h-8 px-2 text-sm flex-1 sm:flex-initial"
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Auto-fill from location...
                        </option>
                        {locations.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleBulkUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileRef.current?.click()}
                      className="rounded-lg h-8"
                    >
                      <Upload className="size-3 mr-1" />
                      Upload Excel
                    </Button>
                  </div>
                  <a
                    href="/api/admin/location-pricing/template"
                    className="inline-flex"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-lg h-8 text-slate-500"
                    >
                      <Download className="size-3 mr-1" />
                      Template
                    </Button>
                  </a>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {newItems.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={item.species_id}
                        onChange={(e) =>
                          updateItem(idx, "species_id", e.target.value)
                        }
                        className="flex-1 rounded-xl border border-slate-200 h-10 px-3 text-sm min-w-0"
                      >
                        <option value="">Select species...</option>
                        {species.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.common_name} ({s.scientific_name})
                          </option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.custom_price}
                        onChange={(e) =>
                          updateItem(idx, "custom_price", e.target.value)
                        }
                        placeholder="Price"
                        className="w-full sm:w-28 rounded-xl"
                      />
                      {newItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeItemRow(idx)}
                        >
                          <Trash2 className="size-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItemRow}
                  className="mt-2 rounded-xl"
                >
                  <Plus className="size-3 mr-1" /> Add Species
                </Button>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving} className="rounded-xl">
                  {saving ? "Creating..." : "Create Price List"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {priceLists.map((pl) => (
          <Card key={pl.id} className="rounded-xl">
            <CardContent className="p-3 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div
                  className="flex-1 cursor-pointer min-w-0"
                  onClick={() => setExpanded(expanded === pl.id ? null : pl.id)}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm sm:text-base text-slate-900 truncate">
                      {pl.title}
                    </h3>
                    <Badge
                      variant={pl.is_active ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {pl.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Client: {pl.client?.name ?? "Unknown"} • {pl.items.length}{" "}
                    species
                  </p>
                  {pl.valid_from && (
                    <p className="text-xs text-slate-400 mt-1">
                      {pl.valid_from} → {pl.valid_until ?? "No expiry"}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => copyLink(pl)}
                    title="Copy link"
                  >
                    <Copy className="size-4" />
                  </Button>
                  <a
                    href={`/orders/${pl.slug}?token=${pl.token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="icon-sm" title="Open">
                      <ExternalLink className="size-4" />
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(pl.id)}
                  >
                    <Trash2 className="size-4 text-red-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      setExpanded(expanded === pl.id ? null : pl.id)
                    }
                  >
                    {expanded === pl.id ? (
                      <ChevronUp className="size-4" />
                    ) : (
                      <ChevronDown className="size-4" />
                    )}
                  </Button>
                </div>
              </div>

              {expanded === pl.id && (
                <div className="mt-4 border-t pt-4 overflow-x-auto">
                  <table className="w-full text-sm min-w-[400px]">
                    <thead>
                      <tr className="text-left text-slate-500">
                        <th className="pb-2">Species</th>
                        <th className="pb-2 hidden sm:table-cell">
                          Scientific Name
                        </th>
                        <th className="pb-2 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pl.items.map((item) => (
                        <tr key={item.id} className="border-t border-slate-50">
                          <td className="py-2">{item.species?.common_name}</td>
                          <td className="py-2 italic text-slate-500 hidden sm:table-cell">
                            {item.species?.scientific_name}
                          </td>
                          <td className="py-2 text-right font-medium">
                            ${Number(item.custom_price).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">
                      <strong>Order Link:</strong>{" "}
                      <code className="bg-white px-2 py-1 rounded text-xs break-all">
                        {typeof window !== "undefined"
                          ? `${window.location.origin}/orders/${pl.slug}?token=${pl.token}`
                          : `/orders/${pl.slug}?token=${pl.token}`}
                      </code>
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {priceLists.length === 0 && (
          <p className="text-center text-slate-500 py-8">
            No price lists yet. Create one to get started.
          </p>
        )}
      </div>
      <ConfirmDialog {...confirmProps} />
    </div>
  );
}
