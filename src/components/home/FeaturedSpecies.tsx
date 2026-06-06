import Link from "next/link";
import { fishProducts } from "@/data/products";
import { getSpecies, getCategories } from "@/lib/queries/species";
import { getSetting } from "@/lib/queries/settings";
import { speciesToFishProduct } from "@/lib/adapters";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function FeaturedSpecies() {
  let featured;
  let categoryName = "Best Sellers";

  try {
    // Check if admin has selected a specific featured category
    const featuredCategoryId = await getSetting("featured_category_id");
    const categories = await getCategories();

    let supabaseSpecies;
    if (featuredCategoryId && featuredCategoryId !== "null") {
      // Fetch species from the admin-selected category
      const category = categories.find((c) => c.id === featuredCategoryId);
      if (category) categoryName = category.name;
      supabaseSpecies = await getSpecies({
        categorySlug: category?.slug,
        limit: 6,
      });
    } else {
      // Fall back to featured flag
      supabaseSpecies = await getSpecies({ featured: true, limit: 6 });
    }

    featured =
      supabaseSpecies.length > 0
        ? supabaseSpecies.map(speciesToFishProduct)
        : fishProducts.filter((p) => p.featured).slice(0, 6);
  } catch {
    featured = fishProducts.filter((p) => p.featured).slice(0, 6);
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-sky-700 font-semibold">
            {categoryName}
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">
            Featured Species
          </h2>
        </div>
        <Link
          href="/catalogue"
          className="text-sm font-semibold text-sky-700 hover:text-sky-600"
        >
          View All Species →
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {featured.map((fish) => (
          <Card
            key={fish.id}
            className="border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
          >
            <CardHeader>
              <Badge
                variant="secondary"
                className="w-fit text-emerald-700 bg-emerald-50 border-0 uppercase tracking-wider text-[10px]"
              >
                {fish.category}
              </Badge>
              <CardTitle className="text-lg font-bold text-slate-900">
                {fish.commonName}
              </CardTitle>
              <CardDescription className="italic text-sky-700">
                {fish.scientificName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 line-clamp-2">
                {fish.description}
              </p>
              <Link
                href="/order"
                className="mt-4 inline-flex text-sm font-semibold text-sky-700 hover:text-sky-600"
              >
                Add to Quote
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
