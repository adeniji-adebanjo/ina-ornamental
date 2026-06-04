import CatalogueClient from "@/components/catalogue/CatalogueClient";
import { fishProducts } from "@/data/products";
import { fetchProducts } from "@/lib/wordpress";

export const metadata = {
  title: "Catalogue",
  description:
    "Browse our full catalogue of premium West African ornamental fish species. Live inventory of bichirs, cichlids, tetras, puffers, catfish and exotic oddballs available for B2B export.",
  alternates: { canonical: "/catalogue" },
};

export default async function CataloguePage() {
  const wpProducts = await fetchProducts();
  const products = wpProducts.length > 0 ? wpProducts : fishProducts;

  return <CatalogueClient products={products} />;
}
