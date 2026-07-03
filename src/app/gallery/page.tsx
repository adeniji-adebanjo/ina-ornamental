import { getSpecies } from "@/lib/queries/species";
import { speciesToFishProduct } from "@/lib/adapters";
import { fishProducts } from "@/data/products";
import type { FishProduct } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { Camera, Fish } from "lucide-react";

export const metadata = {
  title: "Gallery",
  description:
    "Browse our gallery of premium West African ornamental fish — bichirs, cichlids, tetras, puffers, catfish and exotic oddballs sourced from Nigeria.",
  alternates: { canonical: "/gallery" },
};

// Reflect newly added species without a rebuild.
export const revalidate = 300;

const PLACEHOLDER = "/images/fish-placeholder.svg";

export default async function GalleryPage() {
  let species: FishProduct[];
  try {
    const rows = await getSpecies();
    species = rows.length > 0 ? rows.map(speciesToFishProduct) : fishProducts;
  } catch {
    species = fishProducts;
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-12 sm:py-20">
        <Image
          src="/gallery-hero.JPG"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-br from-slate-900/85 via-sky-900/75 to-emerald-900/75" />
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Camera className="size-6 sm:size-8" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              Species Gallery
            </h1>
          </div>
          <p className="text-sky-200 max-w-xl mx-auto">
            Explore our full range of premium West African ornamental fish —
            {" "}
            {species.length}+ species, ethically sourced and export-ready.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {species.length === 0 ? (
          <div className="text-center py-20">
            <Fish className="size-16 text-slate-200 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-600">
              Gallery coming soon
            </h2>
            <p className="text-slate-400 mt-2">
              Check back shortly as we add our species.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {species.map((fish) => (
              <Link
                key={fish.id}
                href="/catalogue"
                className="group relative rounded-2xl overflow-hidden border border-slate-100 bg-linear-to-br from-sky-50 to-emerald-50 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-square">
                  {fish.imageUrl !== PLACEHOLDER ? (
                    <Image
                      src={fish.imageUrl}
                      alt={fish.commonName}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sky-300">
                      <Fish className="size-10 opacity-50" />
                    </div>
                  )}
                  {/* Caption overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3">
                    <p className="text-white font-semibold text-xs sm:text-sm leading-tight line-clamp-1">
                      {fish.commonName}
                    </p>
                    {fish.scientificName && (
                      <p className="text-white/80 text-[10px] sm:text-xs italic line-clamp-1">
                        {fish.scientificName}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
