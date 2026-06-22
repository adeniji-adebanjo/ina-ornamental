"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, Download, Trash2, Globe, FileSpreadsheet } from "lucide-react";
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
          toast.error("Failed to delete");
        }
      },
    });
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Location Pricing
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Upload a master pricing sheet to auto-fill prices when creating
            client price lists.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6">
        <a
          href="/api/admin/location-pricing/template"
          className="w-full sm:w-auto"
        >
          <Button variant="outline" className="rounded-xl w-full sm:w-auto">
            <Download className="size-4 mr-2" />
            Download Template
          </Button>
        </a>
        <div className="w-full sm:w-auto">
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

      {/* Info card */}
      <Card className="mb-6 rounded-xl border-sky-200 bg-sky-50">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <FileSpreadsheet className="size-5 text-sky-700 shrink-0 mt-0.5" />
            <div className="text-sm text-sky-800">
              <p className="font-semibold mb-1">How it works:</p>
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
        <p className="text-sm text-slate-500">Loading...</p>
      ) : locations.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-12 text-center">
            <Globe className="size-10 mx-auto text-slate-300 mb-3" />
            <h3 className="font-semibold text-slate-700 mb-1">
              No pricing data yet
            </h3>
            <p className="text-sm text-slate-500">
              Download the template, fill in prices per region, and upload it.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {locations.map((loc) => (
            <Card key={loc.location} className="rounded-xl">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="size-5 text-sky-700" />
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {loc.location}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {loc.count} species priced
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{loc.count} entries</Badge>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDeleteLocation(loc.location)}
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
