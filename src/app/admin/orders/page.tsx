import { getOrders } from "@/lib/queries/orders";
import OrdersListClient from "./OrdersListClient";

export default async function AdminOrdersPage() {
  const orders = await getOrders();
  return <OrdersListClient orders={orders} />;
}
