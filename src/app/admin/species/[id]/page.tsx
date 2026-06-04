import { getSpeciesById, getCategories } from "@/lib/queries/species";
import { notFound } from "next/navigation";
import SpeciesFormClient from "../SpeciesFormClient";

export default async function EditSpeciesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [species, categories] = await Promise.all([
    getSpeciesById(id),
    getCategories(),
  ]);

  if (!species) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        Edit: {species.common_name}
      </h1>
      <SpeciesFormClient species={species} categories={categories} />
    </div>
  );
}
