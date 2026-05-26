import CatalogueClient from "@/components/catalogue/CatalogueClient";
import { fishProducts } from "@/data/products";
import { fetchProducts } from "@/lib/wordpress";

export const metadata = {
  title: "Catalogue | INA Ornamental Fish",
  description:
    "Browse premium West African ornamental fish species. Live inventory of bichirs, cichlids, tetras, puffers, catfish and exotic oddballs.",
};

export default async function CataloguePage() {
  const wpProducts = await fetchProducts();
  const products = wpProducts.length > 0 ? wpProducts : fishProducts;

  return <CatalogueClient products={products} />;
}
