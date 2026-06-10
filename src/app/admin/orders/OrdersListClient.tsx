"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderWithGroups, OrderStatus } from "@/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog, useConfirmDialog } from "@/components/ui/confirm-dialog";
import { Search, ChevronDown, ChevronUp, UserPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-50 text-slate-600",
  submitted: "bg-amber-50 text-amber-700",
  confirmed: "bg-sky-50 text-sky-700",
  processing: "bg-violet-50 text-violet-700",
  shipped: "bg-emerald-50 text-emerald-700",
  delivered: "bg-green-50 text-green-800",
  cancelled: "bg-red-50 text-red-700",
};

const ALL_STATUSES: OrderStatus[] = [
  "submitted",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export default function OrdersListClient({
  orders,
}: {
  orders: OrderWithGroups[];
}) {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmProps, showConfirm] = useConfirmDialog();
  const router = useRouter();

  const filtered = orders.filter(
    (o) =>
      o.order_reference.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      (o.company_name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  async function updateStatus(orderId: string, status: OrderStatus) {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success(`Status updated to "${status}"`);
      router.refresh();
    } else {
      toast.error("Failed to update status");
    }
  }

  function handleDelete(orderId: string, orderReference: string) {
    showConfirm({
      title: `Delete order ${orderReference}?`,
      description:
        "This action cannot be undone. The order and its line items will be permanently removed.",
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        const res = await fetch(`/api/admin/orders/${orderId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          toast.success(`Order ${orderReference} deleted`);
          router.refresh();
        } else {
          const error = await res.json().catch(() => ({}));
          toast.error(error.error || "Failed to delete order");
        }
      },
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Orders</h1>

      <div className="relative mb-6 flex items-center gap-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input
          placeholder="Search by reference, name, or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-xl"
        />
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg text-xs"
            onClick={async () => {
              const res = await fetch("/api/admin/orders/export");
              if (!res.ok) return toast.error("Failed to export orders");
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `ina-orders-${new Date().toISOString().slice(0,10)}.csv`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
            }}
          >
            Export CSV
          </Button>
        </div>
      </div>

      <p className="text-sm text-slate-500 mb-4">{filtered.length} orders</p>

      <div className="space-y-3">
        {filtered.map((order) => {
          const expanded = expandedId === order.id;
          const totalItems =
            order.order_groups?.reduce(
              (sum, g) =>
                sum + (g.order_items?.reduce((s, i) => s + i.quantity, 0) ?? 0),
              0,
            ) ?? 0;

          return (
            <Card key={order.id} className="rounded-xl">
              <CardContent className="p-3 sm:p-4">
                <div
                  className="flex items-center gap-2 sm:gap-4 cursor-pointer"
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-xs sm:text-sm text-slate-900 font-mono truncate">
                        {order.order_reference}
                      </p>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      {order.customer_name}
                      {order.company_name && ` • ${order.company_name}`}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(order.submitted_at).toLocaleDateString()} •{" "}
                      {totalItems} items • {order.order_groups?.length ?? 0}{" "}
                      groups
                    </p>
                  </div>
                  {expanded ? (
                    <ChevronUp className="size-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="size-4 text-slate-400" />
                  )}
                </div>

                {expanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-500">Email</p>
                        <p className="font-medium">{order.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Phone</p>
                        <p className="font-medium">{order.phone || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Country</p>
                        <p className="font-medium">{order.country || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Address</p>
                        <p className="font-medium">
                          {order.delivery_address || "—"}
                        </p>
                      </div>
                    </div>

                    {order.notes && (
                      <div className="text-sm">
                        <p className="text-xs text-slate-500">Notes</p>
                        <p className="text-slate-700">{order.notes}</p>
                      </div>
                    )}

                    {order.order_groups?.map((group) => (
                      <div key={group.id}>
                        <p className="text-xs font-semibold text-slate-600 mb-2">
                          {group.group_name}
                        </p>
                        <div className="space-y-1">
                          {group.order_items?.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between text-sm py-1 border-b border-slate-50"
                            >
                              <span>
                                {item.species_name}
                                {item.size && (
                                  <span className="text-slate-400">
                                    {" "}
                                    ({item.size})
                                  </span>
                                )}
                              </span>
                              <span className="font-medium">
                                x{item.quantity}
                                {item.unit_price != null && (
                                  <span className="text-slate-500 ml-2">
                                    ${Number(item.unit_price).toFixed(2)}
                                  </span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-slate-100">
                      <div className="flex flex-wrap gap-2 items-center">
                        <p className="text-xs font-medium text-slate-500 mr-2 self-center">
                          Update Status:
                        </p>
                        {ALL_STATUSES.map((s) => (
                          <Button
                            key={s}
                            variant={order.status === s ? "default" : "outline"}
                            size="sm"
                            className="rounded-lg text-xs capitalize"
                            onClick={() => updateStatus(order.id, s)}
                            disabled={order.status === s}
                          >
                            {s}
                          </Button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="rounded-lg text-xs gap-2"
                          onClick={() => handleDelete(order.id, order.order_reference)}
                        >
                          <Trash2 className="size-3.5" />
                          Delete order
                        </Button>
                      </div>
                    </div>

                    {/* Create client + price list action */}
                    <div className="pt-3 border-t border-slate-100">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 rounded-lg text-xs gap-1.5"
                        onClick={() => {
                          const params = new URLSearchParams({
                            name: order.customer_name,
                            email: order.email,
                            company: order.company_name || "",
                            country: order.country || "",
                          });
                          router.push(
                            `/admin/clients?new=1&${params.toString()}`,
                          );
                        }}
                      >
                        <UserPlus className="size-3.5" />
                        Create Client & Price List
                      </Button>
                      <p className="text-xs text-slate-400 mt-1">
                        Creates a client profile and lets you set up custom
                        pricing, then send their private order link.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <ConfirmDialog {...confirmProps} />
    </div>
  );
}

