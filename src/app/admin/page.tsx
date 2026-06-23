import Link from "next/link";
import { getSpecies, getCategories } from "@/lib/queries/species";
import { getOrders } from "@/lib/queries/orders";
import { Card, CardContent } from "@/components/ui/card";
import {
  Fish,
  Package,
  FolderOpen,
  Star,
  Clock,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import type { OrderStatus, OrderWithGroups } from "@/types/database";

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
    getSpecies(),
    getOrders(),
    getCategories(),
  ]);

  const featuredCount = species.filter((s) => s.featured).length;
  const outOfStockCount = species.filter(
    (s) => s.availability === "out_of_stock",
  ).length;
  const pendingCount = orders.filter((o) => o.status === "submitted").length;
  const recentOrders = orders.slice(0, 6);

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
                const date = new Date(order.submitted_at).toLocaleDateString(
                  undefined,
                  { day: "numeric", month: "short", year: "numeric" },
                );
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
                          ? `$${value.toFixed(2)}`
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
