"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Client } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, User, Building2 } from "lucide-react";
import {
  ConfirmDialog,
  useConfirmDialog,
} from "@/components/ui/confirm-dialog";

export default function ClientsListClient({
  clients: initial,
}: {
  clients: Client[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clients, setClients] = useState(initial);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmProps, showConfirm] = useConfirmDialog();
  const [prefill, setPrefill] = useState<Record<string, string>>({});

  // Auto-open form when redirected from admin orders with ?new=1
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setPrefill({
        name: searchParams.get("name") || "",
        email: searchParams.get("email") || "",
        company: searchParams.get("company") || "",
        country: searchParams.get("country") || "",
      });
      setShowForm(true);
    }
  }, [searchParams]);

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name"),
      company: fd.get("company") || null,
      email: fd.get("email") || null,
      phone: fd.get("phone") || null,
      country: fd.get("country") || null,
    };

    const url = editing
      ? `/api/admin/clients/${editing.id}`
      : "/api/admin/clients";
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      toast.success(editing ? "Client updated" : "Client created");
      setShowForm(false);
      setEditing(null);
      router.refresh();
    } else {
      toast.error("Failed to save client");
    }
    setSaving(false);
  }

  function handleDelete(id: string) {
    showConfirm({
      title: "Delete client?",
      description:
        "This will permanently remove the client and all their associated price lists.",
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        const res = await fetch(`/api/admin/clients/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setClients((prev) => prev.filter((c) => c.id !== id));
          toast.success("Client deleted");
        } else {
          toast.error("Failed to delete client");
        }
      },
    });
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Clients
        </h1>
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="rounded-xl w-full sm:w-auto"
        >
          <Plus className="size-4 mr-2" /> Add Client
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <Card className="mb-6 rounded-xl border-sky-200">
          <CardContent className="p-4 sm:p-6">
            <h2 className="font-semibold text-lg mb-4">
              {editing ? "Edit Client" : "New Client"}
            </h2>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <Input
                required
                name="name"
                placeholder="Client Name"
                defaultValue={editing?.name ?? prefill.name ?? ""}
                className="rounded-xl"
              />
              <Input
                name="company"
                placeholder="Company"
                defaultValue={editing?.company ?? prefill.company ?? ""}
                className="rounded-xl"
              />
              <Input
                name="email"
                type="email"
                placeholder="Email"
                defaultValue={editing?.email ?? prefill.email ?? ""}
                className="rounded-xl"
              />
              <Input
                name="phone"
                placeholder="Phone"
                defaultValue={editing?.phone ?? ""}
                className="rounded-xl"
              />
              <Input
                name="country"
                placeholder="Country"
                defaultValue={editing?.country ?? prefill.country ?? ""}
                className="rounded-xl"
              />
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={saving} className="rounded-xl">
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                  }}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filtered.map((c) => (
          <Card key={c.id} className="rounded-xl">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                    <User className="size-5 text-sky-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{c.name}</h3>
                    {c.company && (
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <Building2 className="size-3" /> {c.company}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setEditing(c);
                      setShowForm(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(c.id)}
                  >
                    <Trash2 className="size-4 text-red-500" />
                  </Button>
                </div>
              </div>
              {c.email && (
                <p className="text-sm text-slate-500 mt-2">{c.email}</p>
              )}
              {c.country && (
                <Badge variant="outline" className="mt-2">
                  {c.country}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-slate-500 col-span-full text-center py-8">
            No clients found
          </p>
        )}
      </div>
      <ConfirmDialog {...confirmProps} />
    </div>
  );
}
