import { getSpecies } from "@/lib/queries/species";
import { getOrders } from "@/lib/queries/orders";
import { getCategories } from "@/lib/queries/species";
import { Card, CardContent } from "@/components/ui/card";
import { Fish, Package, FolderOpen, Star } from "lucide-react";

export default async function AdminDashboard() {
  const [species, orders, categories] = await Promise.all([
    getSpecies(),
    getOrders({ limit: 5 }),
    getCategories(),
  ]);

  const featuredCount = species.filter((s) => s.featured).length;

  const stats = [
    { label: "Total Species", value: species.length, icon: Fish },
    { label: "Categories", value: categories.length, icon: FolderOpen },
    { label: "Featured", value: featuredCount, icon: Star },
    { label: "Recent Orders", value: orders.length, icon: Package },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="rounded-xl">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-sky-50">
                <stat.icon className="size-5 text-sky-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {stat.value}
                </p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-xl">
        <CardContent className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Recent Orders</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-slate-500">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm text-slate-800">
                      {order.order_reference}
                    </p>
                    <p className="text-xs text-slate-500">
                      {order.customer_name}
                      {order.company_name && ` • ${order.company_name}`}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      order.status === "submitted"
                        ? "bg-amber-50 text-amber-700"
                        : order.status === "confirmed"
                          ? "bg-sky-50 text-sky-700"
                          : order.status === "shipped"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-50 text-slate-600"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
