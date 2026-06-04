import OrderClient from "@/components/order/OrderClient";

export const metadata = {
  title: "Request Quote",
  description:
    "Submit a B2B order quote request for premium West African ornamental fish species. Add species to your cart and our export team will provide pricing and delivery details.",
  alternates: { canonical: "/order" },
};

export default function OrderPage() {
  return <OrderClient />;
}
