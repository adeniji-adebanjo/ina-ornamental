import { getSpecies, getCategories } from "@/lib/queries/species";
import SpeciesListClient from "./SpeciesListClient";

export default async function SpeciesPage() {
  const [species, categories] = await Promise.all([
    getSpecies(),
    getCategories(),
  ]);

  return <SpeciesListClient species={species} categories={categories} />;
}
