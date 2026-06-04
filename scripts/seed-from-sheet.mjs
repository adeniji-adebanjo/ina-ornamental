import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const SHEET_URL =
  "https://script.google.com/macros/s/AKfycbxt7zdT9AI4m3So--uVHcP-BRSTaQMBwL0xeNYt2SObVsb35YNGQDNQ_v0RkzJQB7fm/exec";
const BEHAVIORAL = new Set(["aggressive", "gentle", "cute", "monster"]);
const PLACEHOLDER = "cropped-cropped-cropped-without-backgound-2022.png";

function slugify(n) {
  return n
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseCats(s) {
  if (!s) return { category: null, tags: [] };
  const parts = s.split(",").map((c) => c.trim());
  const tags = [];
  let cat = null;
  for (const p of parts) {
    if (BEHAVIORAL.has(p.toLowerCase())) {
      tags.push(p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());
    } else if (!cat) {
      cat = p;
    } else {
      tags.push(p);
    }
  }
  return { category: cat, tags };
}

async function main() {
  // Check existing
  const { count } = await supabase
    .from("species")
    .select("*", { count: "exact", head: true });
  console.log("Existing species count:", count);

  if (count > 0) {
    console.log("Species already exist. Skipping seed.");
    return;
  }

  // Fetch data from Google Sheet
  console.log("Fetching from Google Sheet...");
  const res = await fetch(SHEET_URL);
  const fish = await res.json();
  console.log("Fetched", fish.length, "species");

  // Build categories
  const catNames = new Set();
  for (const f of fish) {
    const { category } = parseCats(f.category);
    if (category) catNames.add(category);
  }

  const catMap = {};
  let si = 0;
  for (const name of catNames) {
    const { data, error } = await supabase
      .from("categories")
      .upsert(
        { name, slug: slugify(name), sort_order: si++ },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (!error && data) catMap[name] = data.id;
  }
  console.log("Created", Object.keys(catMap).length, "categories");

  // Insert species + images
  let created = 0;
  let imgs = 0;
  for (let i = 0; i < fish.length; i++) {
    const f = fish[i];
    const { category, tags } = parseCats(f.category);
    const isBest =
      String(f.best_seller || "").toLowerCase() === "yes" ||
      String(f.best_seller || "").toLowerCase() === "true";
    const slug = slugify(f.name);
    const qty =
      typeof f.qty_bx === "number"
        ? f.qty_bx
        : parseInt(String(f.qty_bx), 10) || 1;

    const { data: sp, error } = await supabase
      .from("species")
      .upsert(
        {
          slug,
          common_name: f.name,
          scientific_name: f.sci || null,
          category_id: category ? (catMap[category] ?? null) : null,
          origin: "West Africa",
          sizes: f.sizes ? [f.sizes.trim()] : [],
          tags,
          qty_per_box: qty,
          availability: "available",
          featured: isBest,
          best_seller: isBest,
          sort_order: i,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();

    if (error || !sp) {
      console.log("Skip:", f.name, error?.message);
      continue;
    }
    created++;

    // Insert images (skip placeholder logos)
    if (f.images) {
      const urls = f.images
        .split(",")
        .map((u) => u.trim())
        .filter((u) => u && !u.includes(PLACEHOLDER));
      for (let j = 0; j < urls.length; j++) {
        const { error: ie } = await supabase.from("species_images").insert({
          species_id: sp.id,
          image_url: urls[j],
          alt_text: f.name,
          sort_order: j,
        });
        if (!ie) imgs++;
      }
    }
  }
  console.log(`Done! Species: ${created}, Images: ${imgs}`);
}

main().catch(console.error);
