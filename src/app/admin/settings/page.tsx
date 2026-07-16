import { getCategoriesUncached } from "@/lib/queries/species";
import { getSettingUncached } from "@/lib/queries/settings";
import SettingsClient from "./SettingsClient";

export default async function AdminSettingsPage() {
  const [categories, featuredCategoryId] = await Promise.all([
    getCategoriesUncached(),
    getSettingUncached("featured_category_id"),
  ]);

  return (
    <SettingsClient
      categories={categories}
      currentFeaturedCategoryId={featuredCategoryId}
    />
  );
}
