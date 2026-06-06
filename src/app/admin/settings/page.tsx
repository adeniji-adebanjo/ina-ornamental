import { getCategories } from "@/lib/queries/species";
import { getSetting } from "@/lib/queries/settings";
import SettingsClient from "./SettingsClient";

export default async function AdminSettingsPage() {
  const [categories, featuredCategoryId] = await Promise.all([
    getCategories(),
    getSetting("featured_category_id"),
  ]);

  return (
    <SettingsClient
      categories={categories}
      currentFeaturedCategoryId={featuredCategoryId}
    />
  );
}
