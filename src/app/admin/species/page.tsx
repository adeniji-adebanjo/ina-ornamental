import {
  getSpeciesUncached,
  getCategoriesUncached,
} from "@/lib/queries/species";
import SpeciesListClient from "./SpeciesListClient";

export default async function SpeciesPage() {
  const [species, categories] = await Promise.all([
    getSpeciesUncached(),
    getCategoriesUncached(),
  ]);

  return <SpeciesListClient species={species} categories={categories} />;
}
