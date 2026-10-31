"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Settings, Save, Wifi } from "lucide-react";
import type { Category } from "@/types/database";

interface Props {
  categories: Category[];
  currentFeaturedCategoryId: string | null;
}

export default function SettingsClient({
  categories,
  currentFeaturedCategoryId,
}: Props) {
  const [featuredCategory, setFeaturedCategory] = useState(
    currentFeaturedCategoryId || "",
  );
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "featured_category_id",
          value: featuredCategory,
        }),
      });
      if (res.ok) {
        toast.success("Settings saved");
      } else {
        const data = await res.json().catch(() => null);
        toast.error(
          data?.error ? `Failed to save: ${data.error}` : "Failed to save settings",
        );
      }
    } catch {
      toast.error("Network error — please check your connection and try again.");
    }
    setSaving(false);
  }

  async function handleVerifySmtp() {
    setVerifying(true);
    try {
      const res = await fetch("/api/admin/debug/smtp", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "SMTP connection verified");
      } else if (data?.error) {
        toast.error(
          data.details ? `${data.error}: ${data.details}` : data.error,
        );
      } else {
        toast.error("SMTP verification failed");
      }
    } catch {
      toast.error("Network error while verifying SMTP");
    }
    setVerifying(false);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Settings className="size-6 text-sky-700" />
        <h1 className="text-2xl font-bold text-slate-900">Site Settings</h1>
      </div>

      <Card className="rounded-xl max-w-2xl">
        <CardContent className="p-6 space-y-6">
          <div>
            <h2 className="font-semibold text-lg text-slate-800 mb-1">
              Homepage Featured Section
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Choose which category of species to display in the Featured
              Species section on the homepage. Leave empty to show species
              marked as &quot;featured&quot;.
            </p>
            <label htmlFor="settings-featured-category" className="text-sm font-medium text-slate-700 mb-1 block">
              Featured Category
            </label>
            <select
              id="settings-featured-category"
              value={featuredCategory}
              onChange={(e) => setFeaturedCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 h-10 px-3 text-sm"
            >
              <option value="">All Featured Species (default)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl"
            >
              <Save className="size-4 mr-2" />
              {saving ? "Saving..." : "Save Settings"}
            </Button>
            <Button
              onClick={handleVerifySmtp}
              disabled={verifying}
              variant="outline"
              className="rounded-xl"
            >
              <Wifi className="size-4 mr-2" />
              {verifying ? "Verifying..." : "Verify SMTP"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
