import { pageOpenGraph } from "@/app/shared-metadata";
import CatalogueClient from "@/components/catalogue/CatalogueClient";
import { getSpecies, getCategories } from "@/lib/queries/species";
import { speciesToFishProduct } from "@/lib/adapters";

export const metadata = {
  title: "Catalogue",
  description:
    "Browse our full catalogue of premium West African ornamental fish species. Live inventory of bichirs, cichlids, tetras, puffers, catfish and exotic oddballs available for B2B export.",
  alternates: { canonical: "/catalogue" },
  openGraph: pageOpenGraph({
    title: "Catalogue | INÁ Ornamental Fish",
    description:
      "Live inventory of premium West African ornamental fish — bichirs, cichlids, tetras, puffers, catfish and exotic oddballs for B2B export.",
    url: "/catalogue",
  }),
};

// ISR: re-render at most once a minute; species reads come from the tagged data
// cache, so a normal request rarely touches the database.
export const revalidate = 60;

export default async function CataloguePage() {
  // A failed read throws to app/error.tsx rather than silently showing stale or
  // placeholder data; an empty result renders CatalogueClient's empty state.
  const [supabaseSpecies, dbCategories] = await Promise.all([
    getSpecies(),
    getCategories(),
  ]);
  const categoryNames = dbCategories.map((c) => c.name);
  const products = supabaseSpecies.map(speciesToFishProduct);

  return <CatalogueClient products={products} categories={categoryNames} />;
}
