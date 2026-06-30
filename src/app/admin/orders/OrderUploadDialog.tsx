"use client";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { COUNTRIES, type Country } from "@/data/countries";
import {
  ChevronDown,
  Download,
  FileUp,
  Loader2,
  Search,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const EMPTY = {
  customer_name: "",
  email: "",
  company_name: "",
  delivery_address: "",
  notes: "",
  proposed_shipment_date: "",
  consignee_name: "",
  consignee_phone: "",
  consignee_address: "",
};

const DEFAULT_COUNTRY = COUNTRIES.find((c) => c.code === "NG") ?? COUNTRIES[0];

export default function OrderUploadDialog({
  open,
  onOpenChange,
  onCreated,
}: Props) {
  const [form, setForm] = useState({ ...EMPTY });
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const countryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!countryOpen) return;
    function onDocClick(e: MouseEvent) {
      if (countryRef.current && !countryRef.current.contains(e.target as Node))
        setCountryOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [countryOpen]);

  function set<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function reset() {
    setForm({ ...EMPTY });
    setCountry(DEFAULT_COUNTRY);
    setPhoneNumber("");
    setCountrySearch("");
    setCountryOpen(false);
    setFile(null);
    setErrors([]);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit() {
    if (!form.customer_name.trim() || !form.email.trim()) {
      toast.error("Customer name and email are required.");
      return;
    }
    if (!file) {
      toast.error("Choose a spreadsheet of order items to upload.");
      return;
    }
    setSubmitting(true);
    setErrors([]);
    try {
      const fd = new FormData();
      fd.append("file", file);
      for (const [k, v] of Object.entries(form)) fd.append(k, v);
      fd.append("country", country.name);
      fd.append("phone", phoneNumber ? `${country.dialCode} ${phoneNumber}` : "");

      const res = await fetch("/api/admin/orders/import", {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(`Order ${data.order_reference} created`, {
          description: `${data.itemCount} item(s) across ${data.groupCount} group(s).`,
        });
        reset();
        onOpenChange(false);
        onCreated();
      } else {
        if (Array.isArray(data.errors)) setErrors(data.errors);
        toast.error(data.error || "Failed to create order");
      }
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.dialCode.includes(countrySearch),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload order</DialogTitle>
          <DialogDescription>
            Enter the customer details, then upload a spreadsheet of line items.
            A new order with a unique reference is created.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Customer name" required>
              <Input
                value={form.customer_name}
                onChange={(e) => set("customer_name", e.target.value)}
                className="h-9 rounded-lg"
              />
            </Field>
            <Field label="Email" required>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className="h-9 rounded-lg"
              />
            </Field>
            <Field label="Company">
              <Input
                value={form.company_name}
                onChange={(e) => set("company_name", e.target.value)}
                className="h-9 rounded-lg"
              />
            </Field>

            {/* Country — searchable selector */}
            <Field label="Country">
              <div className="relative" ref={countryRef}>
                <button
                  type="button"
                  onClick={() => setCountryOpen((o) => !o)}
                  className="flex items-center justify-between w-full h-9 px-3 rounded-lg border border-input bg-transparent text-sm hover:bg-slate-50"
                >
                  <span className="truncate">{country.name}</span>
                  <ChevronDown className="size-4 shrink-0 text-slate-400" />
                </button>
                {countryOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-50">
                    <div className="sticky top-0 bg-white p-2 border-b border-slate-100">
                      <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-lg">
                        <Search className="size-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search country..."
                          className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          autoFocus
                        />
                      </div>
                    </div>
                    {filteredCountries.map((c) => (
                      <button
                        key={c.code + c.dialCode}
                        type="button"
                        onClick={() => {
                          setCountry(c);
                          setCountryOpen(false);
                          setCountrySearch("");
                        }}
                        className="flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-sky-50 text-left"
                      >
                        <span>{c.name}</span>
                        <span className="text-slate-400 text-xs font-mono">
                          {c.dialCode}
                        </span>
                      </button>
                    ))}
                    {filteredCountries.length === 0 && (
                      <p className="px-3 py-2 text-sm text-slate-400">
                        No match
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Field>

            {/* Phone — prefixed with the selected country's dial code */}
            <Field label="Phone">
              <div className="flex h-9 rounded-lg border border-input overflow-hidden focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/50">
                <span className="flex items-center px-2.5 bg-slate-50 border-r border-input text-sm font-medium text-slate-700 shrink-0">
                  {country.dialCode}
                </span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) =>
                    setPhoneNumber(e.target.value.replace(/[^\d]/g, ""))
                  }
                  maxLength={country.maxDigits}
                  placeholder={`${country.minDigits}-${country.maxDigits} digits`}
                  className="flex-1 px-2.5 text-sm outline-none bg-transparent min-w-0"
                />
              </div>
            </Field>

            <Field label="Proposed shipment date">
              <DatePicker
                value={form.proposed_shipment_date}
                onChange={(v) => set("proposed_shipment_date", v)}
                placeholder="Select date"
                className="h-9 rounded-lg"
              />
            </Field>
          </div>

          <Field label="Delivery address">
            <Input
              value={form.delivery_address}
              onChange={(e) => set("delivery_address", e.target.value)}
              className="h-9 rounded-lg"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Consignee name">
              <Input
                value={form.consignee_name}
                onChange={(e) => set("consignee_name", e.target.value)}
                className="h-9 rounded-lg"
              />
            </Field>
            <Field label="Consignee phone">
              <Input
                value={form.consignee_phone}
                onChange={(e) => set("consignee_phone", e.target.value)}
                className="h-9 rounded-lg"
              />
            </Field>
            <Field label="Consignee address">
              <Input
                value={form.consignee_address}
                onChange={(e) => set("consignee_address", e.target.value)}
                className="h-9 rounded-lg"
              />
            </Field>
          </div>

          <Field label="Notes">
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              className="rounded-lg"
            />
          </Field>

          {/* Items file */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-700">
                Order items spreadsheet
              </p>
              <a href="/api/admin/orders/template" download className="inline-flex">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-lg h-8 text-slate-500"
                >
                  <Download className="size-3.5 mr-1" />
                  Template
                </Button>
              </a>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              className="rounded-lg"
            >
              <FileUp className="size-4 mr-1.5" />
              {file ? "Change file" : "Choose file"}
            </Button>
            {file && (
              <span className="ml-2 text-sm text-slate-600">{file.name}</span>
            )}
            <p className="text-xs text-slate-500">
              Columns: Group, Species, Scientific Name, Size, Quantity, Unit
              Price. CSV or Excel.
            </p>
          </div>

          {errors.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 max-h-40 overflow-y-auto">
              <p className="text-sm font-semibold text-red-700 mb-1">
                Fix these rows and re-upload:
              </p>
              <ul className="text-xs text-red-600 space-y-0.5 list-disc pl-4">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="rounded-xl"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Upload className="size-4 mr-2" />
            )}
            Create order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}
