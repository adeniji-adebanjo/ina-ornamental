"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Client } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  User,
  Building2,
  ChevronDown,
} from "lucide-react";
import {
  ConfirmDialog,
  useConfirmDialog,
} from "@/components/ui/confirm-dialog";
import { FormModal } from "@/components/ui/form-modal";
import { COUNTRIES } from "@/data/countries";

export default function ClientsListClient({
  clients,
}: {
  clients: Client[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  // Auto-open the form when redirected from admin orders with ?new=1,
  // seeding the prefill values from the query string (read once on mount).
  const [showForm, setShowForm] = useState(
    () => searchParams.get("new") === "1",
  );
  const [editing, setEditing] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmProps, showConfirm] = useConfirmDialog();
  const [prefill] = useState<Record<string, string>>((): Record<
    string,
    string
  > => {
    if (searchParams.get("new") !== "1") return {};
    return {
      name: searchParams.get("name") || "",
      email: searchParams.get("email") || "",
      company: searchParams.get("company") || "",
      country: searchParams.get("country") || "",
    };
  });

  // Phone & Country state
  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRIES.find((c) => c.code === "NG")!,
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [phoneCodeOpen, setPhoneCodeOpen] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);
  const phoneCodeRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        countryRef.current &&
        !countryRef.current.contains(e.target as Node)
      ) {
        setCountryDropdownOpen(false);
      }
      if (
        phoneCodeRef.current &&
        !phoneCodeRef.current.contains(e.target as Node)
      ) {
        setPhoneCodeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Reset the phone/country inputs when the edit target (or prefill) changes.
  // Adjusting state during render is React's recommended alternative to a
  // setState-in-effect, and avoids the extra render an effect would cause.
  const [synced, setSynced] = useState<{
    editing: Client | null;
    prefill: Record<string, string>;
  } | null>(null);
  if (!synced || synced.editing !== editing || synced.prefill !== prefill) {
    setSynced({ editing, prefill });
    if (editing) {
      const match = COUNTRIES.find((c) => c.name === editing.country);
      if (match) setSelectedCountry(match);
      setPhoneNumber(editing.phone?.replace(/^\+\d+\s?/, "") ?? "");
    } else {
      const prefillMatch = COUNTRIES.find((c) => c.name === prefill.country);
      setSelectedCountry(
        prefillMatch ?? COUNTRIES.find((c) => c.code === "NG")!,
      );
      setPhoneNumber("");
    }
  }

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Validate phone length
    if (phoneNumber) {
      const digits = phoneNumber.replace(/\D/g, "");
      if (digits.length < selectedCountry.minDigits) {
        toast.error(
          `Phone number must be at least ${selectedCountry.minDigits} digits for ${selectedCountry.name}`,
        );
        return;
      }
    }

    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name"),
      company: fd.get("company") || null,
      email: fd.get("email") || null,
      phone: phoneNumber ? `${selectedCountry.dialCode} ${phoneNumber}` : null,
      country: selectedCountry.name,
    };

    const url = editing
      ? `/api/admin/clients/${editing.id}`
      : "/api/admin/clients";
    const method = editing ? "PUT" : "POST";

    try {
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
        const err = await res.json().catch(() => null);
        toast.error(err?.error || "Couldn't save the client. Please try again.");
      }
    } catch {
      toast.error("Network error — couldn't save the client. Please try again.");
    } finally {
      setSaving(false);
    }
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
          toast.success("Client deleted");
          router.refresh();
        } else {
          const err = await res.json().catch(() => null);
          toast.error(err?.error || "Couldn't delete the client. Please try again.");
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

      {/* Create / edit form modal */}
      <FormModal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditing(null);
        }}
        title={editing ? "Edit Client" : "New Client"}
      >
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
              <Input
                required
                name="name"
                aria-label="Client name"
                placeholder="Client Name"
                defaultValue={editing?.name ?? prefill.name ?? ""}
                className="rounded-xl"
              />
              <Input
                name="company"
                aria-label="Company"
                placeholder="Company"
                defaultValue={editing?.company ?? prefill.company ?? ""}
                className="rounded-xl"
              />
              <Input
                name="email"
                type="email"
                aria-label="Email"
                placeholder="Email"
                defaultValue={editing?.email ?? prefill.email ?? ""}
                className="rounded-xl"
              />
              {/* Phone with country code */}
              <div className="relative" ref={phoneCodeRef}>
                <div className="flex h-10 rounded-xl border border-input overflow-hidden focus-within:ring-2 focus-within:ring-ring">
                  <button
                    type="button"
                    onClick={() => setPhoneCodeOpen(!phoneCodeOpen)}
                    aria-label={`Dial code ${selectedCountry.dialCode}, change country code`}
                    aria-expanded={phoneCodeOpen}
                    className="flex items-center gap-1 px-2.5 bg-slate-50 border-r border-input text-sm font-medium text-slate-700 hover:bg-slate-100 shrink-0"
                  >
                    {selectedCountry.dialCode}
                    <ChevronDown className="size-3 text-slate-400" />
                  </button>
                  <input
                    type="tel"
                    aria-label="Phone number"
                    placeholder={`Phone (${selectedCountry.minDigits}-${selectedCountry.maxDigits} digits)`}
                    value={phoneNumber}
                    maxLength={selectedCountry.maxDigits}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      if (digits.length <= selectedCountry.maxDigits) {
                        setPhoneNumber(digits);
                      }
                    }}
                    className="flex-1 px-3 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                  />
                </div>
                {phoneCodeOpen && (
                  <div className="absolute top-full left-0 mt-1 w-64 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-50">
                    <div className="sticky top-0 bg-white p-2 border-b border-slate-100">
                      <div className="flex items-center gap-2 px-2 h-8 rounded-lg bg-slate-50 border border-slate-200">
                        <Search className="size-3.5 text-slate-400" />
                        <input
                          type="text"
                          aria-label="Search countries"
                          placeholder="Search country..."
                          className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                          onChange={(e) => setCountrySearch(e.target.value)}
                          autoFocus
                        />
                      </div>
                    </div>
                    {COUNTRIES.filter(
                      (c) =>
                        c.name
                          .toLowerCase()
                          .includes(countrySearch.toLowerCase()) ||
                        c.dialCode.includes(countrySearch),
                    ).map((c) => (
                      <button
                        key={c.code + c.dialCode}
                        type="button"
                        onClick={() => {
                          setSelectedCountry(c);
                          setPhoneCodeOpen(false);
                          setCountrySearch("");
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between"
                      >
                        <span>{c.name}</span>
                        <span className="text-slate-400 text-xs font-mono">
                          {c.dialCode}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Country searchable dropdown */}
              <div className="relative" ref={countryRef}>
                <button
                  type="button"
                  onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                  aria-label={`Country: ${selectedCountry.name}`}
                  aria-expanded={countryDropdownOpen}
                  className="flex items-center justify-between w-full h-10 px-3 rounded-xl border border-input bg-transparent text-sm hover:bg-slate-50"
                >
                  <span className="text-slate-900">{selectedCountry.name}</span>
                  <ChevronDown className="size-4 text-slate-400" />
                </button>
                {countryDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-50">
                    <div className="sticky top-0 bg-white p-2 border-b border-slate-100">
                      <div className="flex items-center gap-2 px-2 h-8 rounded-lg bg-slate-50 border border-slate-200">
                        <Search className="size-3.5 text-slate-400" />
                        <input
                          type="text"
                          aria-label="Search countries"
                          placeholder="Search country..."
                          className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                          onChange={(e) => setCountrySearch(e.target.value)}
                          autoFocus
                        />
                      </div>
                    </div>
                    {COUNTRIES.filter((c) =>
                      c.name
                        .toLowerCase()
                        .includes(countrySearch.toLowerCase()),
                    ).map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          setSelectedCountry(c);
                          setCountryDropdownOpen(false);
                          setCountrySearch("");
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${
                          c.code === selectedCountry.code
                            ? "bg-sky-50 text-sky-800 font-medium"
                            : ""
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
      </FormModal>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input
          aria-label="Search clients"
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
                    aria-label={`Edit ${c.name}`}
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
                    aria-label={`Delete ${c.name}`}
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
