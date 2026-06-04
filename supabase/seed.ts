// ============================================================================
// Seed script: migrates static product data into Supabase
// Run: npx tsx supabase/seed.ts
// Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
// ============================================================================

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Static data extracted from src/data/products.ts
const products = [
  { slug: "tetraodon-mbu", commonName: "Mbu Pufferfish", scientificName: "Tetraodon mbu", category: "Puffers", classOrder: "Tetraodontiformes", description: "One of the largest freshwater pufferfish in the world. The Mbu Puffer is a magnificent species native to the Congo River basin, known for its intelligence and unique personality.", sizes: ["Small", "Medium", "Large"], tags: ["Monster Fish", "Puffers", "Aggressive"], featured: true, bestSeller: false },
  { slug: "polypterus-endlicheri", commonName: "Saddled Bichir", scientificName: "Polypterus endlicheri", category: "Polypterus", classOrder: "Polypteriformes", description: "A prehistoric-looking species with armored scales and lung-like swim bladder. One of the most sought-after bichir species for serious collectors.", sizes: ["Medium", "Big", "Extra Large", "Jumbo", "Extra Jumbo"], tags: ["Monster Fish", "Polypterus", "Aggressive"], featured: true, bestSeller: true },
  { slug: "gnathonemus-petersii", commonName: "Elephant Nose Fish", scientificName: "Gnathonemus petersii", category: "Oddballs", classOrder: "Osteoglossiformes", description: "A fascinating African species with an elongated lower jaw used to detect prey via electric fields. Highly intelligent and unique.", sizes: ["Small", "Medium", "Big"], tags: ["Oddballs", "Gentle"], featured: true, bestSeller: true },
  { slug: "hemichromis-elongatus", commonName: "Five-spot Cichlid", scientificName: "Hemichromis elongatus", category: "Cichlids", classOrder: "Cichliformes", description: "A strikingly colorful African cichlid known as the Five Star General. Vibrant reds and greens make this a showpiece species.", sizes: ["Small", "Medium"], tags: ["Cichlids", "Aggressive"], featured: true, bestSeller: false },
  { slug: "cardisoma-armatum", commonName: "Rainbow Crab", scientificName: "Cardisoma armatum", category: "Crabs", classOrder: "Crustacea", description: "A stunning land crab with vibrant blue, orange and purple coloring. Popular in paludariums and terrariums worldwide.", sizes: ["Small", "Medium", "Big"], tags: ["Crabs"], featured: true, bestSeller: true },
  { slug: "protopterus-annectens", commonName: "West African Lungfish", scientificName: "Protopterus annectens", category: "Lungfish", classOrder: "Dipnoi", description: "An ancient species that can breathe air using primitive lungs. Incredibly hardy and can survive in challenging conditions.", sizes: ["Small", "Medium", "Big", "Large"], tags: ["Monster Fish", "Oddballs"], featured: true, bestSeller: false },
  { slug: "erpetoichthys-calabaricus", commonName: "Ropefish", scientificName: "Erpetoichthys calabaricus", category: "Polypterus", classOrder: "Polypteriformes", description: "A snake-like fish related to bichirs with a long, eel-shaped body. Peaceful and fascinating to observe in aquariums.", sizes: ["Medium", "Large"], tags: ["Polypterus", "Gentle"], featured: false, bestSeller: false },
  { slug: "pantodon-buchholzi", commonName: "African Butterfly Fish", scientificName: "Pantodon buchholzi", category: "Oddballs", classOrder: "Osteoglossiformes", description: "A surface-dwelling predator with large pectoral fins resembling butterfly wings. A classic oddball species from West Africa.", sizes: ["Small", "Medium/Big"], tags: ["Oddballs", "Gentle"], featured: false, bestSeller: false },
  { slug: "phenacogrammus-interruptus", commonName: "Congo Tetra", scientificName: "Phenacogrammus interruptus", category: "Tetras", classOrder: "Characiformes", description: "One of the most beautiful freshwater fish with iridescent rainbow coloring and flowing fins. A must-have for planted tanks.", sizes: ["Small", "Medium"], tags: ["Tetras", "Gentle"], featured: true, bestSeller: true },
  { slug: "polypterus-senegalus", commonName: "Senegal Bichir", scientificName: "Polypterus senegalus", category: "Polypterus", classOrder: "Polypteriformes", description: "The most commonly available bichir species, great for beginners. Hardy, peaceful, and an excellent introduction to polypterus.", sizes: ["Small", "Medium"], tags: ["Polypterus", "Gentle"], featured: false, bestSeller: false },
  { slug: "malapterurus-electricus", commonName: "Electric Catfish", scientificName: "Malapterurus electricus", category: "Catfish", classOrder: "Siluriformes", description: "A truly unique catfish capable of generating electric shocks. A fascinating oddball for experienced fishkeepers.", sizes: ["Small", "Medium", "Big"], tags: ["Monster Fish", "Catfish", "Aggressive"], featured: false, bestSeller: false },
  { slug: "pelvicachromis-pulcher", commonName: "Kribensis", scientificName: "Pelvicachromis pulcher", category: "Cichlids", classOrder: "Cichliformes", description: "A beautiful dwarf cichlid with vibrant colors, especially breeding females. Easy to care for and a community tank favorite.", sizes: ["Small", "Medium"], tags: ["Cichlids", "Gentle"], featured: false, bestSeller: false },
  { slug: "heterotis-niloticus", commonName: "African Arowana", scientificName: "Heterotis niloticus", category: "Oddballs", classOrder: "Osteoglossiformes", description: "A large, impressive species related to Asian and South American arowanas. A prized trophy fish for monster fish enthusiasts.", sizes: ["Small", "Large", "Extra Large"], tags: ["Monster Fish", "Oddballs"], featured: true, bestSeller: false },
  { slug: "hydrocynus-vittatus", commonName: "African Tigerfish", scientificName: "Hydrocynus vittatus", category: "Tetras", classOrder: "Characiformes", description: "The legendary African Tigerfish with razor-sharp teeth and fearsome reputation. A true apex predator of African rivers.", sizes: ["Small", "Medium", "Big"], tags: ["Monster Fish", "Tetras", "Aggressive"], featured: true, bestSeller: true },
  { slug: "atyopsis-gabonensis", commonName: "Blue Shrimp", scientificName: "Atyopsis gabonensis", category: "Oddballs", classOrder: "Crustacea", description: "A large, filter-feeding freshwater shrimp native to West Africa. Peaceful and fascinating with their fan-like feeding appendages.", sizes: ["Small", "Medium", "Big", "Jumbo"], tags: ["Gentle", "Oddballs"], featured: false, bestSeller: false },
  { slug: "polypterus-teugelsi", commonName: "Teugelsi Bichir", scientificName: "Polypterus teugelsi", category: "Polypterus", classOrder: "Polypteriformes", description: "A rare and highly sought-after bichir species with distinctive marbled patterning. A collector's dream species.", sizes: ["Small", "Medium"], tags: ["Polypterus", "Gentle"], featured: false, bestSeller: false },
  { slug: "synodontis-eupterus", commonName: "Feather-fin Synodontis", scientificName: "Synodontis eupterus", category: "Catfish", classOrder: "Siluriformes", description: "A beautiful catfish with feathery dorsal fin extensions. Hardy and peaceful, perfect for community tanks with larger fish.", sizes: ["Small", "Medium"], tags: ["Catfish", "Gentle"], featured: false, bestSeller: false },
  { slug: "goniopsis-pelii", commonName: "Mangrove Crab", scientificName: "Goniopsis pelii", category: "Crabs", classOrder: "Crustacea", description: "A striking purple mangrove crab from West Africa. Semi-terrestrial and perfect for paludarium setups.", sizes: ["Small", "Medium"], tags: ["Crabs"], featured: false, bestSeller: false },
  { slug: "tetraodon-lineatus", commonName: "Nile Pufferfish", scientificName: "Tetraodon lineatus", category: "Puffers", classOrder: "Tetraodontiformes", description: "A beautifully patterned freshwater pufferfish from the Nile River system. Intelligent and full of personality.", sizes: ["Small", "Medium"], tags: ["Puffers", "Aggressive"], featured: false, bestSeller: false },
  { slug: "xenomystus-nigri", commonName: "African Brown Knifefish", scientificName: "Xenomystus nigri", category: "Oddballs", classOrder: "Osteoglossiformes", description: "A sleek, nocturnal species with undulating fin movement. An interesting oddball for species tanks.", sizes: ["Small", "Medium"], tags: ["Oddballs", "Gentle"], featured: false, bestSeller: false },
  { slug: "gymnarchus-niloticus", commonName: "Aba Aba", scientificName: "Gymnarchus niloticus", category: "Oddballs", classOrder: "Osteoglossiformes", description: "A large, impressive electric fish from the Nile basin. Generates weak electric fields for navigation and communication.", sizes: ["Small", "Large", "Extra Large"], tags: ["Monster Fish", "Oddballs", "Aggressive"], featured: false, bestSeller: false },
  { slug: "aphyosemion-bivittatum", commonName: "Two-striped Lyretail", scientificName: "Aphyosemion bivittatum", category: "Killifish", classOrder: "Cyprinodontiformes", description: "A stunningly colorful killifish with vibrant reds, blues and yellows. A jewel of West African streams.", sizes: ["Small"], tags: ["Killifish", "Gentle"], featured: false, bestSeller: false },
  { slug: "chromidotilapia-guntheri", commonName: "Günther's Mouthbrooder", scientificName: "Chromidotilapia guntheri", category: "Cichlids", classOrder: "Cichliformes", description: "A fascinating mouthbrooding cichlid from West Africa with excellent parental care behavior.", sizes: ["Small", "Medium"], tags: ["Cichlids", "Gentle"], featured: false, bestSeller: false },
  { slug: "polypterus-bichir-lapradei", commonName: "Nile Bichir", scientificName: "Polypterus bichir lapradei", category: "Polypterus", classOrder: "Polypteriformes", description: "One of the largest bichir species, a true prehistoric giant. Impressive and commanding presence in any large aquarium.", sizes: ["Medium", "Large", "Extra Large"], tags: ["Monster Fish", "Polypterus"], featured: true, bestSeller: false },
];

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function seed() {
  console.log("🌱 Seeding database...\n");

  // 1. Collect unique categories
  const categoryNames = [...new Set(products.map((p) => p.category))];
  console.log(`📂 Creating ${categoryNames.length} categories...`);

  const categoryMap: Record<string, string> = {};
  for (const name of categoryNames) {
    const { data, error } = await supabase
      .from("categories")
      .upsert({ name, slug: slugify(name), sort_order: categoryNames.indexOf(name) }, { onConflict: "slug" })
      .select()
      .single();
    if (error) {
      console.error(`  ❌ Category "${name}":`, error.message);
      continue;
    }
    categoryMap[name] = data.id;
    console.log(`  ✅ ${name}`);
  }

  // 2. Insert species
  console.log(`\n🐟 Creating ${products.length} species...`);
  for (const p of products) {
    const { data, error } = await supabase
      .from("species")
      .upsert(
        {
          slug: p.slug,
          common_name: p.commonName,
          scientific_name: p.scientificName,
          category_id: categoryMap[p.category] ?? null,
          class_order: p.classOrder,
          description: p.description,
          origin: "West Africa",
          sizes: p.sizes,
          tags: p.tags,
          qty_per_box: 1,
          availability: "available",
          featured: p.featured,
          best_seller: p.bestSeller,
          sort_order: products.indexOf(p),
        },
        { onConflict: "slug" },
      )
      .select()
      .single();

    if (error) {
      console.error(`  ❌ ${p.commonName}:`, error.message);
    } else {
      console.log(`  ✅ ${p.commonName} (${data.id})`);
    }
  }

  console.log("\n✨ Seed complete!");
}

seed().catch(console.error);
