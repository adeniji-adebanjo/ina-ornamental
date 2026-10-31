import Link from "next/link";
import {
  getSpeciesUncached,
  getCategoriesUncached,
} from "@/lib/queries/species";
import { getOrders } from "@/lib/queries/orders";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatUSD } from "@/lib/format";
import {
  Fish,
  Package,
  FolderOpen,
  Star,
  Clock,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import type {
  OrderStatus,
  OrderWithGroups,
  AvailabilityStatus,
} from "@/types/database";
import { ChartCard } from "@/components/admin/charts/ChartCard";
import { BarList } from "@/components/admin/charts/BarList";
import { TrendChart } from "@/components/admin/charts/TrendChart";

const STATUS_STYLES: Record<OrderStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  submitted: "bg-amber-50 text-amber-700",
  confirmed: "bg-sky-50 text-sky-700",
  processing: "bg-violet-50 text-violet-700",
  shipped: "bg-indigo-50 text-indigo-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-600",
};

function orderTotals(order: OrderWithGroups) {
  let pieces = 0;
  let value = 0;
  for (const group of order.order_groups ?? []) {
    for (const item of group.order_items ?? []) {
      pieces += item.quantity ?? 0;
      value += (item.quantity ?? 0) * (item.unit_price ?? 0);
    }
  }
  return { pieces, value };
}

export default async function AdminDashboard() {
  const [species, orders, categories] = await Promise.all([
    getSpeciesUncached(),
    getOrders(),
    getCategoriesUncached(),
  ]);

  const featuredCount = species.filter((s) => s.featured).length;
  const outOfStockCount = species.filter(
    (s) => s.availability === "out_of_stock",
  ).length;
  const pendingCount = orders.filter((o) => o.status === "submitted").length;
  const recentOrders = orders.slice(0, 6);

  // ── Analytics aggregation (server-side) ──
  // Orders per day over the last 30 days.
  const DAYS = 30;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const dayIndex = new Map<string, number>();
  const ordersPerDay: { label: string; value: number }[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(startOfToday);
    d.setDate(startOfToday.getDate() - i);
    dayIndex.set(d.toISOString().slice(0, 10), ordersPerDay.length);
    ordersPerDay.push({
      label: formatDate(d, { day: "numeric", month: "short" }),
      value: 0,
    });
  }
  let orders30 = 0;
  let value30 = 0;
  for (const o of orders) {
    const key = new Date(o.submitted_at).toISOString().slice(0, 10);
    const idx = dayIndex.get(key);
    if (idx !== undefined) {
      ordersPerDay[idx].value += 1;
      orders30 += 1;
      value30 += orderTotals(o).value;
    }
  }

  // Orders by status (fixed order).
  const STATUS_ORDER: OrderStatus[] = [
    "submitted",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];
  const statusItems = STATUS_ORDER.map((s) => ({
    label: s.charAt(0).toUpperCase() + s.slice(1),
    value: orders.filter((o) => o.status === s).length,
  }));

  // Species per category (top 8).
  const catCount = new Map<string, number>();
  for (const s of species) {
    const name = s.category?.name ?? "Uncategorized";
    catCount.set(name, (catCount.get(name) ?? 0) + 1);
  }
  const categoryItems = [...catCount.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Stock availability breakdown (fixed order).
  const AVAILABILITY: { key: AvailabilityStatus; label: string }[] = [
    { key: "available", label: "In Stock" },
    { key: "limited_stock", label: "Limited" },
    { key: "out_of_stock", label: "Out of Stock" },
    { key: "seasonal", label: "Seasonal" },
    { key: "on_request", label: "On Request" },
  ];
  const availabilityItems = AVAILABILITY.map((a) => ({
    label: a.label,
    value: species.filter((s) => s.availability === a.key).length,
  }));

  // Top ordered species by total quantity (top 6).
  const qtyBySpecies = new Map<string, number>();
  for (const o of orders)
    for (const g of o.order_groups ?? [])
      for (const it of g.order_items ?? [])
        qtyBySpecies.set(
          it.species_name,
          (qtyBySpecies.get(it.species_name) ?? 0) + (it.quantity ?? 0),
        );
  const topSpeciesItems = [...qtyBySpecies.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const stats = [
    {
      label: "Total Species",
      value: species.length,
      icon: Fish,
      tint: "bg-sky-50 text-sky-700",
      href: "/admin/species",
    },
    {
      label: "Categories",
      value: categories.length,
      icon: FolderOpen,
      tint: "bg-violet-50 text-violet-700",
      href: "/admin/species",
    },
    {
      label: "Featured",
      value: featuredCount,
      icon: Star,
      tint: "bg-amber-50 text-amber-700",
      href: "/admin/species",
    },
    {
      label: "Total Orders",
      value: orders.length,
      icon: Package,
      tint: "bg-emerald-50 text-emerald-700",
      href: "/admin/orders",
    },
    {
      label: "Pending Orders",
      value: pendingCount,
      icon: Clock,
      tint: "bg-orange-50 text-orange-700",
      href: "/admin/orders",
    },
    {
      label: "Out of Stock",
      value: outOfStockCount,
      icon: AlertTriangle,
      tint: "bg-red-50 text-red-600",
      href: "/admin/species",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          An overview of your catalogue and recent activity.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-8">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="group">
            <Card className="rounded-xl h-full transition-shadow group-hover:shadow-md">
              <CardContent className="p-4 sm:p-5">
                <div
                  className={`inline-flex p-2.5 rounded-xl mb-3 ${stat.tint}`}
                >
                  <stat.icon className="size-5" />
                </div>
                <p className="text-2xl font-bold text-slate-900 leading-none">
                  {stat.value}
                </p>
                <p className="text-xs text-slate-500 mt-1.5">{stat.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Analytics */}
      <div className="mb-8 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ChartCard
            title="Orders — last 30 days"
            subtitle={`${orders30} order${orders30 === 1 ? "" : "s"}${
              value30 > 0
                ? ` · ${formatUSD(value30, { whole: true })} est. value`
                : ""
            }`}
            className="lg:col-span-2"
          >
            <TrendChart data={ordersPerDay} valueLabel="orders" />
          </ChartCard>
          <ChartCard title="Orders by status">
            <BarList items={statusItems} emptyLabel="No orders yet." />
          </ChartCard>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ChartCard title="Species by category">
            <BarList items={categoryItems} emptyLabel="No species yet." />
          </ChartCard>
          <ChartCard title="Stock availability">
            <BarList items={availabilityItems} emptyLabel="No species yet." />
          </ChartCard>
          <ChartCard title="Top species ordered" subtitle="By total quantity">
            <BarList
              items={topSpeciesItems}
              format={(n) => `${n.toLocaleString()} pcs`}
              emptyLabel="No orders yet."
            />
          </ChartCard>
        </div>
      </div>

      {/* Recent orders */}
      <Card className="rounded-xl">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Recent Orders</h2>
            {orders.length > 0 && (
              <Link
                href="/admin/orders"
                className="inline-flex items-center gap-1 text-sm text-sky-700 hover:text-sky-800"
              >
                View all
                <ArrowRight className="size-3.5" />
              </Link>
            )}
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-10 text-center">
              <Package className="size-9 mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">No orders yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentOrders.map((order) => {
                const { pieces, value } = orderTotals(order);
                const date = formatDate(order.submitted_at);
                return (
                  <Link
                    key={order.id}
                    href="/admin/orders"
                    className="flex items-center justify-between gap-3 py-3 -mx-2 px-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-slate-800 truncate">
                          {order.order_reference}
                        </p>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[order.status]}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {order.customer_name}
                        {order.company_name && ` • ${order.company_name}`}
                        {order.country && ` • ${order.country}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-slate-800">
                        {value > 0
                          ? formatUSD(value)
                          : `${pieces} pcs`}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{date}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
