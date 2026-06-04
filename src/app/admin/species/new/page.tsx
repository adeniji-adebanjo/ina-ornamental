import { getCategories } from "@/lib/queries/species";
import SpeciesFormClient from "../SpeciesFormClient";

export default async function NewSpeciesPage() {
  const categories = await getCategories();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        Add New Species
      </h1>
      <SpeciesFormClient categories={categories} />
    </div>
  );
}
