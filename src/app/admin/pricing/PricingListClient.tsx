"use client";

import { useState, useRef, useEffect } from "react";
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
  Info,
  Pencil,
  Check,
  X,
  Loader2,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import {
  ConfirmDialog,
  useConfirmDialog,
} from "@/components/ui/confirm-dialog";
import { FormModal } from "@/components/ui/form-modal";
import { DatePicker, formatDateDisplay } from "@/components/ui/date-picker";

interface Species {
  id: string;
  common_name: string;
  scientific_name: string;
  availability: string;
}

// Availability is a global, per-species property managed in Admin → Species.
// It is never stored on a price list. This form only displays it, but a
// pricing upload (with an Availability column) can update the global value.
const AVAILABILITY_BADGES: Record<string, { label: string; className: string }> =
  {
    available: { label: "In Stock", className: "bg-emerald-50 text-emerald-700" },
    limited_stock: { label: "Limited", className: "bg-amber-50 text-amber-700" },
    out_of_stock: { label: "Out of Stock", className: "bg-red-50 text-red-700" },
    seasonal: { label: "Seasonal", className: "bg-sky-50 text-sky-700" },
    on_request: { label: "On Request", className: "bg-slate-100 text-slate-600" },
  };

function availabilityBadge(status?: string) {
  return AVAILABILITY_BADGES[status ?? "on_request"] ?? AVAILABILITY_BADGES.on_request;
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
  species: {
    common_name: string;
    scientific_name: string;
    availability?: string;
  } | null;
}

interface PriceList {
  id: string;
  client_id: string;
  slug: string;
  access_token: string;
  title: string;
  valid_from: string | null;
  valid_until: string | null;
  active: boolean;
  created_at: string;
  client: Client | null;
  items: PriceItem[];
}

export default function PricingListClient({
  priceLists,
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
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [newItems, setNewItems] = useState<
    { species_id: string; custom_price: string }[]
  >([{ species_id: "", custom_price: "" }]);
  const [confirmProps, showConfirm] = useConfirmDialog();
  const fileRef = useRef<HTMLInputElement>(null);

  // Inline editing of an existing list item's price.
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  // Download (Excel/CSV) menu — holds the id of the list whose menu is open.
  const [downloadFor, setDownloadFor] = useState<string | null>(null);
  const downloadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!downloadFor) return;
    const onDocClick = (e: MouseEvent) => {
      if (downloadRef.current && !downloadRef.current.contains(e.target as Node))
        setDownloadFor(null);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [downloadFor]);

  // Add-species control for the currently expanded list.
  const [addSpeciesId, setAddSpeciesId] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const [addingItem, setAddingItem] = useState(false);

  function startEditItem(item: PriceItem) {
    setEditingItemId(item.id);
    setEditPrice(String(item.custom_price));
  }

  async function saveItemPrice(listId: string, item: PriceItem) {
    const price = parseFloat(editPrice);
    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Enter a valid price greater than 0");
      return;
    }
    setBusyItemId(item.id);
    try {
      const res = await fetch(
        `/api/admin/pricing/${listId}/items/${item.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ custom_price: price }),
        },
      );
      if (res.ok) {
        toast.success("Price updated");
        setEditingItemId(null);
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || "Failed to update price");
      }
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setBusyItemId(null);
    }
  }

  function removeItem(listId: string, item: PriceItem) {
    showConfirm({
      title: `Remove "${item.species?.common_name ?? "species"}"?`,
      description: "This species will be removed from this price list.",
      confirmLabel: "Remove",
      variant: "danger",
      onConfirm: async () => {
        const res = await fetch(
          `/api/admin/pricing/${listId}/items/${item.id}`,
          { method: "DELETE" },
        );
        if (res.ok) {
          toast.success("Species removed");
          router.refresh();
        } else {
          const data = await res.json().catch(() => null);
          toast.error(data?.error || "Failed to remove species");
        }
      },
    });
  }

  async function addSpeciesToList(listId: string) {
    const price = parseFloat(addPrice);
    if (!addSpeciesId) {
      toast.error("Select a species");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Enter a valid price greater than 0");
      return;
    }
    setAddingItem(true);
    try {
      const res = await fetch(`/api/admin/pricing/${listId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ species_id: addSpeciesId, custom_price: price }),
      });
      if (res.ok) {
        toast.success("Species added");
        setAddSpeciesId("");
        setAddPrice("");
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || "Failed to add species");
      }
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setAddingItem(false);
    }
  }

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
          // Postgres decimal/numeric columns are serialized as strings by Supabase.
          price: number | string;
        }[] = await res.json();
        if (data.length === 0) {
          toast.info("No pricing data found for this location");
          setLoadingLocation(false);
          return;
        }
        // Group by species (take the first/generic price per species)
        const priceMap = new Map<string, number>();
        for (const row of data) {
          const price = Number(row.price);
          if (!priceMap.has(row.species_id) && !isNaN(price)) {
            priceMap.set(row.species_id, price);
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
      toast.error("Network error — please check your connection and try again.");
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
        toast.success(`Loaded ${data.items.length} species from file`, {
          description: data.availabilityUpdated
            ? `Updated availability for ${data.availabilityUpdated} species`
            : undefined,
        });
        if (data.errors?.length) {
          toast.warning(`${data.errors.length} rows had issues`);
        }
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to parse file", {
          description: err.errors?.length
            ? err.errors.slice(0, 3).join("; ")
            : undefined,
        });
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
          toast.success("Price list deleted");
          router.refresh();
        } else {
          const data = await res.json().catch(() => null);
          toast.error(data?.error || "Couldn't delete the price list. Please try again.");
        }
      },
    });
  }

  function copyLink(pl: PriceList) {
    const url = `${window.location.origin}/orders/${pl.slug}?token=${pl.access_token}`;
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

      <FormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Create Price List"
      >
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
                <div>
                  <label
                    htmlFor="valid_from"
                    className="text-sm font-medium text-slate-700 mb-1 block"
                  >
                    Valid from
                    <span title="Date when this custom price list becomes active.">
                      <Info className="inline-block size-4 ml-1 text-slate-400" />
                    </span>
                  </label>
                  <DatePicker
                    id="valid_from"
                    name="valid_from"
                    placeholder="Select start date"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Optional start date for this pricing.
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="valid_until"
                    className="text-sm font-medium text-slate-700 mb-1 block"
                  >
                    Valid until
                    <span title="Date when this custom price list expires. Leave empty to keep it active indefinitely.">
                      <Info className="inline-block size-4 ml-1 text-slate-400" />
                    </span>
                  </label>
                  <DatePicker
                    id="valid_until"
                    name="valid_until"
                    placeholder="No expiry"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Optional expiration date. Leave empty for no expiry.
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Species & Custom Prices
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Availability is a global per-species setting (managed in{" "}
                  <strong>Species</strong>) and is never stored on a price list.
                  It&apos;s shown below for reference — but uploading a sheet
                  with an Availability column updates each species&apos; global
                  availability.
                </p>

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
                      accept=".xlsx,.xls,.csv"
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
                  {/* File-download endpoint (Route Handler), not a page — <a download> is correct here. */}
                  <a
                    href="/api/admin/pricing/template"
                    download
                    className="inline-flex"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-lg h-8 text-slate-500"
                    >
                      <Download className="size-3 mr-1" />
                      Custom Pricing Template
                    </Button>
                  </a>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {newItems.map((item, idx) => {
                    const selectedSpecies = species.find(
                      (s) => s.id === item.species_id,
                    );
                    const badge = selectedSpecies
                      ? availabilityBadge(selectedSpecies.availability)
                      : null;
                    return (
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
                      {badge && (
                        <span
                          title="Managed in Species"
                          className={`self-center shrink-0 text-[10px] font-medium px-2 py-1 rounded-full ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      )}
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
                    );
                  })}
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
      </FormModal>

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
                      variant={pl.active ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {pl.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Client: {pl.client?.name ?? "Unknown"} • {pl.items.length}{" "}
                    species
                  </p>
                  {pl.valid_from && (
                    <p className="text-xs text-slate-400 mt-1">
                      {formatDateDisplay(pl.valid_from)} →{" "}
                      {pl.valid_until ? formatDateDisplay(pl.valid_until) : "No expiry"}
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
                    href={`/orders/${pl.slug}?token=${pl.access_token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="icon-sm" title="Open">
                      <ExternalLink className="size-4" />
                    </Button>
                  </a>

                  {/* Download as an order form (Excel carries live formulas) */}
                  <div
                    className="relative"
                    ref={downloadFor === pl.id ? downloadRef : undefined}
                  >
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Download price list"
                      onClick={() =>
                        setDownloadFor(downloadFor === pl.id ? null : pl.id)
                      }
                    >
                      <Download className="size-4" />
                    </Button>
                    {downloadFor === pl.id && (
                      <div className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                        <a
                          href={`/api/admin/pricing/${pl.id}/export?format=xlsx`}
                          download
                          onClick={() => setDownloadFor(null)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-sky-50"
                        >
                          <FileSpreadsheet className="size-4 text-sky-700" />
                          Excel (.xlsx)
                        </a>
                        <a
                          href={`/api/admin/pricing/${pl.id}/export?format=csv`}
                          download
                          onClick={() => setDownloadFor(null)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-sky-50"
                        >
                          <FileText className="size-4 text-slate-500" />
                          CSV (.csv)
                        </a>
                      </div>
                    )}
                  </div>

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
                  <table className="w-full text-sm sm:min-w-[400px]">
                    <thead>
                      <tr className="text-left text-slate-500">
                        <th className="pb-2">Species</th>
                        <th className="pb-2 hidden sm:table-cell">
                          Scientific Name
                        </th>
                        <th className="pb-2">Availability</th>
                        <th className="pb-2 text-right lg:w-44 lg:pl-8">
                          Price
                        </th>
                        <th className="pb-2 text-right w-px lg:w-40 lg:pl-6">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pl.items.map((item) => {
                        const badge = availabilityBadge(
                          item.species?.availability,
                        );
                        return (
                          <tr
                            key={item.id}
                            className="border-t border-slate-50"
                          >
                            <td className="py-2">
                              {item.species?.common_name}
                            </td>
                            <td className="py-2 italic text-slate-500 hidden sm:table-cell">
                              {item.species?.scientific_name}
                            </td>
                            <td className="py-2">
                              <span
                                className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${badge.className}`}
                              >
                                {badge.label}
                              </span>
                            </td>
                            <td className="py-2 text-right font-medium lg:pl-8">
                              {editingItemId === item.id ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  autoFocus
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveItemPrice(pl.id, item);
                                    if (e.key === "Escape") setEditingItemId(null);
                                  }}
                                  className="h-8 w-24 ml-auto rounded-lg text-right"
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => startEditItem(item)}
                                  className="inline-flex items-center gap-1 rounded px-1 hover:text-sky-700 hover:bg-sky-50"
                                  title="Edit price"
                                >
                                  ${Number(item.custom_price).toFixed(2)}
                                  <Pencil className="size-3 text-slate-400" />
                                </button>
                              )}
                            </td>
                            <td className="py-2 text-right whitespace-nowrap lg:pl-6">
                              {editingItemId === item.id ? (
                                <span className="inline-flex items-center gap-0.5">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    disabled={busyItemId === item.id}
                                    onClick={() => saveItemPrice(pl.id, item)}
                                    title="Save"
                                  >
                                    {busyItemId === item.id ? (
                                      <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                      <Check className="size-4 text-emerald-600" />
                                    )}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => setEditingItemId(null)}
                                    title="Cancel"
                                  >
                                    <X className="size-4 text-slate-500" />
                                  </Button>
                                </span>
                              ) : (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => removeItem(pl.id, item)}
                                  title="Remove species"
                                >
                                  <Trash2 className="size-4 text-red-500" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Add a species to this list */}
                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <select
                      value={addSpeciesId}
                      onChange={(e) => setAddSpeciesId(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 h-9 px-3 text-sm min-w-0"
                    >
                      <option value="">Add species…</option>
                      {species
                        .filter(
                          (s) =>
                            !pl.items.some((it) => it.species_id === s.id),
                        )
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.common_name} ({s.scientific_name})
                          </option>
                        ))}
                    </select>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={addPrice}
                      onChange={(e) => setAddPrice(e.target.value)}
                      placeholder="Price"
                      className="w-full sm:w-28 rounded-xl h-9"
                    />
                    <Button
                      type="button"
                      onClick={() => addSpeciesToList(pl.id)}
                      disabled={addingItem}
                      className="rounded-xl h-9"
                    >
                      {addingItem ? (
                        <Loader2 className="size-4 mr-1 animate-spin" />
                      ) : (
                        <Plus className="size-4 mr-1" />
                      )}
                      Add
                    </Button>
                  </div>
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">
                      <strong>Order Link:</strong>{" "}
                      <code className="bg-white px-2 py-1 rounded text-xs break-all">
                        {typeof window !== "undefined"
                          ? `${window.location.origin}/orders/${pl.slug}?token=${pl.access_token}`
                          : `/orders/${pl.slug}?token=${pl.access_token}`}
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
