import { getClientPriceList } from "@/lib/queries/client-pricing";
import { notFound } from "next/navigation";
import ClientOrderClient from "./ClientOrderClient";

export const dynamic = "force-dynamic";

// Private, token-gated client price lists — never index these.
export const metadata = {
  robots: { index: false, follow: false },
};

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

  // Everything passed to a client component is visible in the page payload.
  // Strip secrets and admin-only fields; the form only prefills contact info.
  const safePriceList = {
    ...priceList,
    access_token: "",
    password_hash: null,
    client: priceList.client
      ? { ...priceList.client, notes: null, address: null }
      : null,
  };

  return (
    <ClientOrderClient priceList={safePriceList} slug={slug} token={token} />
  );
}
