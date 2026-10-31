import { getSpecies } from "@/lib/queries/species";
import { speciesToFishProduct } from "@/lib/adapters";
import type { FishProduct } from "@/types";
import { ArrowRight, Fish } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const PLACEHOLDER = "/images/fish-placeholder.svg";

export default async function GalleryPreview() {
  let species: FishProduct[];
  try {
    const rows = await getSpecies();
    species = rows.map(speciesToFishProduct);
  } catch (err) {
    // A home-page section should not take the whole page down; hide it instead.
    console.error("GalleryPreview: failed to load species", err);
    return null;
  }

  // Prefer species that actually have a photo for the preview strip.
  const withImages = species.filter((s) => s.imageUrl !== PLACEHOLDER);
  const display = (withImages.length >= 6 ? withImages : species).slice(0, 12);

  if (display.length === 0) return null;

  return (
    <section className="bg-slate-50 border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-sky-700 font-semibold">
              Gallery
            </p>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">
              A Glimpse of Our Collection
            </h2>
          </div>
          <Link
            href="/gallery"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:text-sky-600"
          >
            View All <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
          {display.map((fish) => (
            <Link
              key={fish.id}
              href="/gallery"
              className="group relative aspect-square rounded-xl overflow-hidden border border-slate-100 bg-linear-to-br from-sky-50 to-emerald-50"
            >
              {fish.imageUrl !== PLACEHOLDER ? (
                <Image
                  src={fish.imageUrl}
                  alt={fish.commonName}
                  fill
                  sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sky-300">
                  <Fish className="size-8 opacity-50" />
                </div>
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="absolute bottom-2 left-2 right-2 text-white text-[11px] font-medium leading-tight line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {fish.commonName}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-6 flex justify-center sm:hidden">
          <Link
            href="/gallery"
            className="inline-flex items-center gap-1.5 rounded-full bg-sky-800 text-white px-5 py-2.5 text-sm font-semibold hover:bg-sky-700"
          >
            View Full Gallery <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
