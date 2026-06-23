"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Upload,
  Download,
  Trash2,
  Globe,
  FileSpreadsheet,
  Pencil,
  Check,
  X,
} from "lucide-react";
import {
  ConfirmDialog,
  useConfirmDialog,
} from "@/components/ui/confirm-dialog";

interface LocationGroup {
  location: string;
  count: number;
}

export default function LocationPricingClient({
  initialLocations,
}: {
  initialLocations: LocationGroup[];
}) {
  const [locations, setLocations] = useState<LocationGroup[]>(initialLocations);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmProps, showConfirm] = useConfirmDialog();

  // Refetch the grouped locations (e.g. after an upload/delete).
  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/location-pricing");
      if (res.ok) {
        const data = await res.json();
        // Group by location
        const grouped: Record<string, number> = {};
        for (const row of data) {
          grouped[row.location] = (grouped[row.location] || 0) + 1;
        }
        setLocations(
          Object.entries(grouped).map(([location, count]) => ({
            location,
            count,
          })),
        );
      }
    } catch {
      toast.error("Failed to load pricing data");
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/location-pricing", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          `Imported ${data.inserted} pricing entries for ${data.locations.length} locations`,
          {
            description:
              [
                data.availabilityUpdated &&
                  `Updated availability for ${data.availabilityUpdated} species`,
                data.duplicatesMerged &&
                  `Merged ${data.duplicatesMerged} duplicate species/size rows`,
              ]
                .filter(Boolean)
                .join(" · ") || undefined,
          },
        );
        if (data.errors?.length) {
          toast.warning(`${data.errors.length} rows had issues`, {
            description: data.errors.slice(0, 3).join("; "),
          });
        }
        fetchLocations();
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function startRename(location: string) {
    setEditing(location);
    setRenameValue(location);
  }

  async function handleRename(from: string) {
    const to = renameValue.trim();
    if (!to || to === from) {
      setEditing(null);
      return;
    }
    setRenaming(true);
    try {
      const res = await fetch("/api/admin/location-pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to }),
      });
      if (res.ok) {
        setLocations((prev) =>
          prev
            .map((l) => (l.location === from ? { ...l, location: to } : l))
            .sort((a, b) => a.location.localeCompare(b.location)),
        );
        toast.success(`Renamed "${from}" to "${to}"`);
        setEditing(null);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to rename");
      }
    } catch {
      toast.error("Failed to rename");
    }
    setRenaming(false);
  }

  function handleDeleteLocation(location: string) {
    showConfirm({
      title: `Delete pricing for "${location}"?`,
      description:
        "All pricing entries for this location will be permanently removed.",
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        const res = await fetch(
          `/api/admin/location-pricing?location=${encodeURIComponent(location)}`,
          { method: "DELETE" },
        );
        if (res.ok) {
          setLocations((prev) => prev.filter((l) => l.location !== location));
          toast.success(`Pricing for "${location}" deleted`);
        } else {
          const data = await res.json().catch(() => null);
          toast.error(data?.error || `Couldn't delete pricing for "${location}". Please try again.`);
        }
      },
    });
  }

  const totalEntries = locations.reduce((sum, l) => sum + l.count, 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Location Pricing
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Upload a master pricing sheet to auto-fill prices when creating
            client price lists.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0">
          <a href="/api/admin/location-pricing/template">
            <Button variant="outline" className="rounded-xl w-full sm:w-auto">
              <Download className="size-4 mr-2" />
              Download Template
            </Button>
          </a>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleUpload}
            className="hidden"
            id="pricing-upload"
          />
          <Button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="rounded-xl w-full sm:w-auto"
          >
            <Upload className="size-4 mr-2" />
            {uploading ? "Uploading..." : "Upload Pricing Sheet"}
          </Button>
        </div>
      </div>

      {/* Summary */}
      {locations.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 max-w-md">
          <Card className="rounded-xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700">
                <Globe className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 leading-none">
                  {locations.length}
                </p>
                <p className="text-xs text-slate-500 mt-1">Locations</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                <FileSpreadsheet className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 leading-none">
                  {totalEntries}
                </p>
                <p className="text-xs text-slate-500 mt-1">Priced entries</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info card */}
      <Card className="mb-6 rounded-xl border-sky-200 bg-sky-50">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <FileSpreadsheet className="size-5 text-sky-700 shrink-0 mt-0.5" />
            <div className="text-sm text-sky-800">
              <p className="font-semibold mb-1">How it works</p>
              <ol className="list-decimal ml-4 space-y-1 text-sky-700">
                <li>
                  Download the template — it&apos;s pre-filled with all your
                  species
                </li>
                <li>
                  Fill in prices for each location/region column (e.g. Europe,
                  Asia, USA)
                </li>
                <li>Upload the completed file here</li>
                <li>
                  When you create a client price list, select the client&apos;s
                  region and prices auto-fill
                </li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location list */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[72px] rounded-xl bg-slate-100 animate-pulse"
            />
          ))}
        </div>
      ) : locations.length === 0 ? (
        <Card className="rounded-xl border-dashed">
          <CardContent className="py-12 text-center">
            <Globe className="size-10 mx-auto text-slate-300 mb-3" />
            <h3 className="font-semibold text-slate-700 mb-1">
              No pricing data yet
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Download the template, fill in prices per region, and upload it.
            </p>
            <Button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="rounded-xl"
            >
              <Upload className="size-4 mr-2" />
              Upload Pricing Sheet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <h2 className="text-sm font-semibold text-slate-500 mb-3">
            Locations
          </h2>
          <div className="space-y-2.5">
            {locations.map((loc) => {
              const isEditing = editing === loc.location;
              return (
                <Card
                  key={loc.location}
                  className="rounded-xl transition-shadow hover:shadow-sm"
                >
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="p-2 rounded-lg bg-sky-50 text-sky-700 shrink-0">
                        <Globe className="size-4" />
                      </div>
                      {isEditing ? (
                        <Input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename(loc.location);
                            if (e.key === "Escape") setEditing(null);
                          }}
                          autoFocus
                          disabled={renaming}
                          className="h-9 rounded-lg"
                        />
                      ) : (
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-800 truncate">
                            {loc.location}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {loc.count} species priced
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                      {isEditing ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleRename(loc.location)}
                            disabled={renaming}
                            title="Save"
                          >
                            <Check className="size-4 text-emerald-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setEditing(null)}
                            disabled={renaming}
                            title="Cancel"
                          >
                            <X className="size-4 text-slate-500" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => startRename(loc.location)}
                            title="Rename"
                          >
                            <Pencil className="size-4 text-slate-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDeleteLocation(loc.location)}
                            title="Delete"
                          >
                            <Trash2 className="size-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <ConfirmDialog {...confirmProps} />
    </div>
  );
}
