import { getClientPriceList } from "@/lib/queries/client-pricing";
import { notFound } from "next/navigation";
import ClientOrderClient from "./ClientOrderClient";

export const dynamic = "force-dynamic";

export default async function ClientOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { slug } = await params;
  const { token } = await searchParams;

  if (!token) notFound();

  const priceList = await getClientPriceList(slug, token);
  if (!priceList) notFound();

  return <ClientOrderClient priceList={priceList} />;
}
