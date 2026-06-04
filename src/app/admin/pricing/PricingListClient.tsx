"use client";

import { useState } from "react";
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
} from "lucide-react";

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
}: {
  priceLists: PriceList[];
  clients: Client[];
  species: Species[];
}) {
  const router = useRouter();
  const [priceLists, setPriceLists] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newItems, setNewItems] = useState<
    { species_id: string; custom_price: string }[]
  >([{ species_id: "", custom_price: "" }]);

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

  async function handleDelete(id: string) {
    if (!confirm("Delete this price list?")) return;
    const res = await fetch(`/api/admin/pricing/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPriceLists((prev) => prev.filter((p) => p.id !== id));
      toast.success("Price list deleted");
    } else {
      toast.error("Failed to delete");
    }
  }

  function copyLink(pl: PriceList) {
    const url = `${window.location.origin}/orders/${pl.slug}?token=${pl.token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Custom Pricing</h1>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="rounded-xl bg-sky-800 hover:bg-sky-700"
        >
          <Plus className="size-4 mr-2" /> New Price List
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6 rounded-xl border-sky-200">
          <CardContent className="p-6">
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
                <div className="space-y-2">
                  {newItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <select
                        value={item.species_id}
                        onChange={(e) =>
                          updateItem(idx, "species_id", e.target.value)
                        }
                        className="flex-1 rounded-xl border border-slate-200 h-10 px-3 text-sm"
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
                        className="w-28 rounded-xl"
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
                <Button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-sky-800 hover:bg-sky-700"
                >
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
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => setExpanded(expanded === pl.id ? null : pl.id)}
                >
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{pl.title}</h3>
                    <Badge
                      variant={pl.is_active ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {pl.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500">
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
                <div className="mt-4 border-t pt-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500">
                        <th className="pb-2">Species</th>
                        <th className="pb-2">Scientific Name</th>
                        <th className="pb-2 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pl.items.map((item) => (
                        <tr key={item.id} className="border-t border-slate-50">
                          <td className="py-2">{item.species?.common_name}</td>
                          <td className="py-2 italic text-slate-500">
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
    </div>
  );
}
