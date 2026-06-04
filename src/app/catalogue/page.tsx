import CatalogueClient from "@/components/catalogue/CatalogueClient";
import { fishProducts } from "@/data/products";
import { getSpecies } from "@/lib/queries/species";
import { speciesToFishProduct } from "@/lib/adapters";

export const metadata = {
  title: "Catalogue",
  description:
    "Browse our full catalogue of premium West African ornamental fish species. Live inventory of bichirs, cichlids, tetras, puffers, catfish and exotic oddballs available for B2B export.",
  alternates: { canonical: "/catalogue" },
};

export default async function CataloguePage() {
  let products;
  try {
    const supabaseSpecies = await getSpecies();
    products =
      supabaseSpecies.length > 0
        ? supabaseSpecies.map(speciesToFishProduct)
        : fishProducts;
  } catch {
    products = fishProducts;
  }

  return <CatalogueClient products={products} />;
}
