import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { getSpecies } from "@/lib/queries/species";
import { fishProducts } from "@/data/products";
import {
  Flame,
  ShieldCheck,
  FlaskConical,
  Lock,
  Sparkles,
  Waves,
  CheckCircle2,
  Plane,
  FileCheck2,
  Building2,
  Mail,
  Globe,
  Fish,
} from "lucide-react";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://inaornamentalfish.com";

export const metadata = {
  title: "About",
  description:
    "INÁ Ornamental Fish — the international trade brand of DCM Tropical Fish Ltd. A Tier-1 B2B wholesale exporter of West African and Nigerian freshwater ornamental fish, engineered for predictable supply, seamless customs compliance, and high live-arrival rates.",
  alternates: { canonical: "/about" },
};

// ── Content ──────────────────────────────────────────────────────────────────

const advantages = [
  {
    icon: FlaskConical,
    title: "Access to Specialists",
    body: "You stop buying from generalists who treat West African fish as an afterthought. You gain a dedicated partner who masters the specific water chemistry, conditioning parameters, and handling demands of Nigerian ichthyofauna — resulting in structurally sound livestock.",
  },
  {
    icon: Lock,
    title: "De-risked Transactions",
    body: "Your investment is protected by an operational philosophy rooted in righteousness and fair dealing. For your business, this means zero hidden costs, absolute transparency in inventory counts, and an unyielding commitment to delivering exactly what was promised.",
  },
  {
    icon: Sparkles,
    title: "Unlocking New Market Demand",
    body: "You turn West African biodiversity into your distinct competitive edge. By introducing rare, beautifully conditioned Nigerian species to your catalog, you attract high-end collectors and specialist retailers who gladly pay a premium for exclusivity.",
  },
  {
    icon: Waves,
    title: "Supply Chain Resilience",
    body: "Our passion is your operational security. Live fish export leaves zero margin for error, so we channel our energy into meticulous pre-shipment conditioning to minimize your landing losses.",
  },
];

const portfolio = [
  { sci: "Erpetoichthys calabaricus", common: "Ropefish / Reedfish" },
  { sci: "Pantodon buchholzi", common: "Freshwater Butterflyfish" },
  { sci: "Gnathonemus petersii", common: "Elephantnose Fish" },
  { sci: "Pelvicachromis pulcher", common: "Kribensis Cichlid" },
  { sci: "Synodontis nigriventris", common: "Upside-down Catfish" },
  { sci: "Polypterus senegalus", common: "Senegal Bichir" },
  { sci: "Arnoldichthys spilopterus", common: "Niger Tetra" },
  { sci: "Malapterurus electricus", common: "Electric Catfish" },
  { sci: "Ctenopoma kingsleyae", common: "Tailspot Bushfish" },
  { sci: "Phractolaemus ansorgii", common: "Hingemouth" },
  { sci: "Tetraodon mbu", common: "Mbu Puffer" },
  { sci: "Tetraodon pustulatus", common: "Cross River Puffer" },
];

const steps = [
  {
    title: "Inventory Lock",
    body: "We verify your species requests against current seasonal availability and cross-reference your specific country-of-destination import regulations.",
  },
  {
    title: "Priority Freight Reservation",
    body: "We immediately secure dedicated air cargo space with premium carriers so your shipment avoids unnecessary tarmac layovers.",
  },
  {
    title: "7-Day Stabilization Guarantee",
    body: "Fish enter our dedicated holding facilities for a mandatory one-week quarantine and conditioning period — stabilizing their systems and safely purging them for long-haul travel.",
  },
  {
    title: "Aviation-Grade Sorting & Packing",
    body: "Livestock is meticulously sorted to eliminate weak specimens, then packed using specialized thermal barriers to maintain water stability.",
  },
  {
    title: "Bilateral Documentation Audit",
    body: "We finalize and verify all local and international health certificates before the truck ever leaves our facility.",
  },
  {
    title: "Expedited Airport Dispatch",
    body: "Cargo is transferred directly to the airline under climate-controlled conditions and loaded onto your scheduled flight.",
  },
  {
    title: "Post-Arrival Accountability",
    body: "Our relationship does not end when the plane lands. We monitor your shipment through transit and provide an active 48-hour follow-up window to support your receiving team.",
  },
];

const freightEconomics = [
  {
    title: "Minimum Order Volume",
    body: "To keep international air-freight rates economically viable for your business, we operate on an ideal minimum of 8 boxes / 100 kg per shipment.",
  },
  {
    title: "Tarmac Time Reduction",
    body: "We route shipments through major global transit hubs using only competent, professional freight partners — protecting your live assets from extreme temperature drops and extended delays.",
  },
  {
    title: "Flawless Documentation Packing",
    body: "Every order arrives with an Air Waybill (AWB), Federal Ministry of Environment Health Certificate (Nigeria), EU Health Certificate where required, and a comprehensive commercial invoice with matching packing list.",
  },
];

const costing = [
  {
    title: "IATA-Compliant Packaging",
    body: "Livestock travels in premium, heavy-duty, temperature-stabilized insulation and double-sealed oxygenated bags, strictly adhering to IATA Live Animals Regulations (LAR) to maximize survival rates.",
  },
  {
    title: "Transparent Unit Costing",
    body: "Packaging, handling, and documentation fees are calculated on a standardized per-box and per-kilogram framework. You receive a fully itemized, locked-in quotation before confirming your order.",
  },
  {
    title: "Mitigated Onboarding Risk",
    body: "To reduce initial trade friction and help you test our network, we extend a preferential introductory discount to qualified first-time clients.",
  },
  {
    title: "Equitable Deficit Protection (DOA Policy)",
    body: "We share the risk of live transit with you. In the rare event of mortality, provide clear photographic evidence within 24–48 hours of arrival and your claim is evaluated fairly, transparently, and promptly credited.",
  },
];

const factSheet: { label: string; value: string; href?: string }[] = [
  { label: "Brand Name", value: "INÁ Ornamental Fish" },
  { label: "Registered Corporate Entity", value: "DCM Tropical Fish Ltd." },
  { label: "Managing Director / Founder", value: "Alfred Omololu" },
  { label: "Corporate Headquarters", value: "Lagos, Nigeria" },
  {
    label: "Primary Logistics Hub",
    value: "Murtala Muhammed International Airport (LOS)",
  },
  { label: "Business Category", value: "Tier-1 B2B Wholesale Exporter" },
  {
    label: "Core Market Specialization",
    value: "West African & Nigerian Freshwater Ichthyofauna",
  },
  { label: "Minimum Order Volume", value: "8 Boxes" },
  { label: "Minimum Order Weight", value: "100 kg" },
  {
    label: "Primary Airline Partners",
    value: "Lufthansa Cargo, Ethiopian Cargo, Turkish Cargo",
  },
  {
    label: "Standard Trade Documentation",
    value:
      "AWB, Health Certificate, EU Health Certificate, Commercial Invoice, Packing List",
  },
  {
    label: "Eligible Client Profiles",
    value:
      "Volume Importers, Transhippers, Distributors, Large-Scale Aquarium Chains",
  },
  {
    label: "Official Website",
    value: "inaornamentalfish.com",
    href: SITE_URL,
  },
  {
    label: "Primary Commercial Email",
    value: "alfred@inaornamentalfish.com",
    href: "mailto:alfred@inaornamentalfish.com",
  },
  {
    label: "Secondary Contact",
    value: "inaornamental@gmail.com",
    href: "mailto:inaornamental@gmail.com",
  },
  { label: "Global Service Footprint", value: "Worldwide International Airports" },
];

// Verified knowsAbout species — duplicates removed (case-insensitive).
const knowsAboutRaw = [
  "Erpetoichthys calabaricus", "Pantodon buchholzi", "Gnathonemus petersii",
  "Pelvicachromis pulcher", "Synodontis nigriventris", "Gymnarchus niloticus",
  "Hepsetus odoe", "Hydrocynus goliath", "Hydrocynus vittatus",
  "Brycinus longipinnis", "Chrysichthys nigrodigitatus", "Guinearma huzardi",
  "Anguilla anguilla", "Aphyosemion australe", "Aphyosemion bivittatum",
  "Aphyosemion calliurum", "Fundulopanchax deltaensis", "Synodontis budgetti",
  "Xenopus species", "Heterotis niloticus", "Hemichromis fasciatus",
  "Bagrus ubangensis", "Barbus gracilis", "Petrocephalus simus",
  "Phractolaemus ansorgii", "Aplocheilichthys myersi", "Cardisoma guanhumi",
  "Aplocheilus panchax", "Atyopsis gabonensis", "Ctenopoma kingsleyae",
  "Chromidotilapia guntheri", "Clarias angolensis", "Enteromius callipterus",
  "Tetraodon pustulatus", "Pareutropius debauwi", "Mormyrus kannume",
  "Mormyrus longirostris", "Microsynodontis batesii", "Channallabes apus",
  "Malapterurus electricus", "Uca tangeri", "Clibanarius africanus",
  "Palaemonetes paludosus", "Auchenoglanis occidentalis", "Parailia pellucida",
  "Eleotris sp.", "Hyperopisus bebe", "Schilbe marmoratus",
  "Poecilia reticulata", "Isichthys henryi", "Hemichromis bimaculatus",
  "Xenomystus nigri", "Pelvicachromis taeniatus", "Labeo rubropunctatus",
  "Aplocheilichthys grahami", "Epiplatys grahami", "Polycentropsis abbreviata",
  "Ctenopoma acutirostre", "Distichodus fasciolatus",
  "Aplocheilichthys macrophthalmus", "Lutjanus argentimaculatus",
  "Papyrocranus afer", "Protopterus aethiopicus", "Tetraodon mbu",
  "Megalops atlanticus", "Monodactylus sebae", "Citharinus citharinus",
  "Scylla serrata", "Periophthalmus argentilineatus", "Neolebias powelli",
  "Synodontis eupterus", "Desmocaris trispinosa", "Lates niloticus",
  "Synodontis ocellifer", "Nannocharax latifasciatus",
  "Aplocheilichthys spilauchen", "Nannostomus species", "Phago loricatus",
  "Enneacampus ansorgii", "Polypterus teugelsi", "Polypterus endlicheri",
  "Polypterus dabola", "Polypterus lapradei", "Polypterus senegalus",
  "Procatopus similis", "Tetraodon fahaka", "Goniopsis pelii",
  "Cardisoma armatum", "Perisesarma bidens", "Pseudosesarma moeschi",
  "Arnoldichthys spilopterus", "Micralestes humilis", "Brycinus imberi",
  "Aplocheilichthys scheeli", "Fundulopanchax scheeli", "Raiamas senegalensis",
  "Pollimyrus nigripinnis", "Synodontis membranaceus", "Hemichromis elongatus",
  "Neolebias ansorgii", "Channa striata", "Mastacembelus frenatus",
  "Parauchenoglanis macrostoma", "Protopterus annectens", "Synodontis striatus",
  "Sesarma pisonii", "Litoria caerulea", "Hyperolius species",
  "Petrocephalus soudanensis", "Synodontis nigrita", "Hymenochirus",
  "Pomacea bridgesii", "Brienomyrus brachyistius", "Phractura ansorgii",
  "Pseudotropheus zebra", "Tetraodon miurus",
];

const knowsAbout = (() => {
  const seen = new Set<string>();
  return knowsAboutRaw.filter((s) => {
    const key = s.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
})();

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WholesaleStore",
  name: "INÁ Ornamental Fish",
  alternateName: "DCM Tropical Fish Ltd.",
  image: `${SITE_URL}/icon-512.png`,
  logo: `${SITE_URL}/icon-512.png`,
  url: SITE_URL,
  email: "alfred@inaornamentalfish.com",
  founder: { "@type": "Person", name: "Alfred Omololu" },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Lagos",
    addressCountry: "NG",
  },
  description:
    "B2B wholesale exporter of West African and Nigerian freshwater ornamental fish species.",
  knowsAbout,
  offers: {
    "@type": "Offer",
    description:
      "Wholesale livestock export. Minimum order quantity 8 boxes / 100 kg.",
  },
};

// ── Reusable bits ────────────────────────────────────────────────────────────

function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mb-8">
      <p className="text-xs uppercase tracking-[0.2em] text-sky-700 font-semibold mb-2">
        {eyebrow}
      </p>
      <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{title}</h2>
    </div>
  );
}

// Build a scientific-name → image map so the portfolio can show real photos.
// Uploaded catalogue images take priority; the static dataset fills gaps.
async function getPortfolioImages(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const PLACEHOLDER = "/images/fish-placeholder.svg";
  for (const p of fishProducts) {
    if (p.scientificName && p.imageUrl && p.imageUrl !== PLACEHOLDER) {
      map.set(p.scientificName.toLowerCase().trim(), p.imageUrl);
    }
  }
  try {
    const species = await getSpecies();
    for (const s of species) {
      const img = s.images?.[0]?.image_url;
      if (s.scientific_name && img && img !== PLACEHOLDER) {
        map.set(s.scientific_name.toLowerCase().trim(), img);
      }
    }
  } catch {
    // Fall back to whatever the static dataset provided.
  }
  return map;
}

export default async function AboutPage() {
  const imageBySci = await getPortfolioImages();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <Image
          src="/about-hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-br from-slate-900/90 via-sky-900/75 to-emerald-900/70" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-200 font-semibold mb-3">
            About INÁ Ornamental Fish
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight">
            Securing Your West African Supply Chain
          </h1>
          <p className="mt-6 text-lg text-sky-100/90 max-w-3xl leading-relaxed">
            {`"Iná is the Yoruba word for fire. It is the driving force behind our operations — and it is the reason your business receives livestock that stands out in the global market."`}
          </p>
        </div>
      </section>

      {/* Intro / the fire */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex p-3 rounded-2xl bg-amber-50 text-amber-600 shrink-0">
            <Flame className="size-6" />
          </div>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              {`In Yoruba, Iná means fire. The acute accent on the "Á" is its tonal heart, giving the word its meaning and life force. For your business, this fire translates into the energy, discipline, and relentless quality control required to bring vibrant, healthy West African fish to your holding facilities.`}
            </p>
            <p>
              {`Your business deserves a predictable, highly specialized supply chain. We engineered INÁ to strip the volatility out of importing tropical livestock from West Africa. By combining deep regional collection knowledge with international logistics standards, we ensure your distributors, transhippers, and retail clients receive premium, highly marketable stock precisely when you expect it.`}
            </p>
            <p className="font-medium text-slate-800">
              {`We are not focused on chasing volume — we are entirely focused on being your most trusted, dependable supplier on the African continent.`}
            </p>
          </div>
        </div>
      </section>

      {/* Customs compliance / DCM */}
      <section className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <SectionHeading
            eyebrow="Regulatory Security"
            title="Streamlining Your Customs Compliance"
          />
          <Card className="rounded-2xl border-slate-100 shadow-sm">
            <CardContent className="p-6 md:p-8 flex flex-col sm:flex-row gap-5">
              <div className="flex p-3 rounded-2xl bg-sky-50 text-sky-700 h-fit shrink-0">
                <ShieldCheck className="size-6" />
              </div>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  {`When you import livestock, administrative delays at the border are catastrophic for your bottom line. To guarantee seamless customs clearance and absolute regulatory compliance, INÁ Ornamental Fish operates as the specialized, international trade brand of DCM Tropical Fish Ltd.`}
                </p>
                <p>
                  {`Your import brokers receive all official wildlife permits, bilateral health certificates, and commercial invoices issued directly under our registered corporate entity, DCM Tropical Fish Ltd. This dual structure gives your business the agile, dedicated support of a boutique specialist — backed by the institutional security of an established legal exporter.`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Strategic advantages */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <SectionHeading
          eyebrow="Why Partner With Us"
          title="Your Strategic Advantages"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {advantages.map((a) => (
            <Card key={a.title} className="rounded-2xl border-slate-100">
              <CardContent className="p-6">
                <div className="flex p-2.5 rounded-xl bg-emerald-50 text-emerald-700 w-fit mb-4">
                  <a.icon className="size-5" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{a.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {a.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Portfolio */}
      <section className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <SectionHeading
            eyebrow="Diversifying Your Portfolio"
            title="High-Demand West African Species"
          />
          <p className="text-slate-600 leading-relaxed mb-8 max-w-3xl">
            {`To help your procurement and inventory managers plan their next season, we maintain stable, high-volume access to these highly demanded West African freshwater species:`}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {portfolio.map((p) => {
              const img = imageBySci.get(p.sci.toLowerCase().trim());
              return (
                <div
                  key={p.sci}
                  className="rounded-xl bg-white border border-slate-100 overflow-hidden"
                >
                  <div className="relative aspect-4/3 bg-linear-to-br from-sky-50 to-emerald-50">
                    {img ? (
                      <Image
                        src={img}
                        alt={p.common}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sky-300">
                        <Fish className="size-10 opacity-50" />
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-3">
                    <p className="font-semibold text-slate-800 italic">
                      {p.sci}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{p.common}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7-step guarantee */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <SectionHeading
          eyebrow="Operational Pipeline"
          title="The 7-Step Quality Guarantee"
        />
        <p className="text-slate-600 leading-relaxed mb-8 max-w-3xl">
          {`Every shipment follows a rigid, repeatable pipeline designed to maximize live-arrival rates at your facility.`}
        </p>
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={s.title}>
              <Card className="rounded-2xl border-slate-100">
                <CardContent className="p-5 flex gap-4">
                  <div className="flex items-center justify-center size-9 rounded-full bg-sky-800 text-white font-bold text-sm shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{s.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mt-1">
                      {s.body}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* B2B logistics */}
      <section className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <SectionHeading
            eyebrow="Engineered For Your Margins"
            title="B2B Logistics & Asset Protection"
          />

          {/* Wholesale notice */}
          <Card className="rounded-2xl border-amber-200 bg-amber-50 mb-8">
            <CardContent className="p-5 flex gap-3">
              <Building2 className="size-5 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900 leading-relaxed">
                <span className="font-bold">Wholesale Trade Notice: </span>
                {`Our infrastructure is built exclusively to support high-volume commercial businesses — international importers, large-scale distributors, transhippers, and commercial aquarium retail chains. We do not supply individual hobbyists or accept small retail orders.`}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Plane className="size-5 text-sky-700" />
                <h3 className="font-bold text-slate-900">
                  Maximizing Your Freight Economics
                </h3>
              </div>
              <div className="space-y-3">
                {freightEconomics.map((f) => (
                  <Card key={f.title} className="rounded-xl border-slate-100">
                    <CardContent className="p-4 flex gap-3">
                      <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">
                          {f.title}
                        </p>
                        <p className="text-sm text-slate-600 leading-relaxed mt-0.5">
                          {f.body}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileCheck2 className="size-5 text-sky-700" />
                <h3 className="font-bold text-slate-900">
                  Predictable Costing & Asset Protection
                </h3>
              </div>
              <div className="space-y-3">
                {costing.map((c) => (
                  <Card key={c.title} className="rounded-xl border-slate-100">
                    <CardContent className="p-4 flex gap-3">
                      <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">
                          {c.title}
                        </p>
                        <p className="text-sm text-slate-600 leading-relaxed mt-0.5">
                          {c.body}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <SectionHeading
          eyebrow="Grounded Leadership, Shared Growth"
          title="Alfred Omololu, Founder"
        />
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardContent className="p-6 md:p-8 space-y-4 text-slate-600 leading-relaxed">
            <p>
              {`INÁ was founded by Alfred Omololu, a practical entrepreneur who built this business through execution, deep industry curiosity, and a relentless drive to improve. Alfred operates with a profound sense of self-awareness — never hesitant to ask the hard operational questions required to optimize our systems for your benefit.`}
            </p>
            <p>
              {`As a committed Christian, Alfred's leadership blueprint is built on the standard of treating people right. In practice, this means a workplace where local employees are paid fairly and treated with dignity — which directly reflects in the meticulous care they give to sorting and packing your fish. To Alfred, providing extreme value to you, the client, is a responsibility. He measures success by the simultaneous, healthy growth of a profitable business, a strong household, and a trusted reputation among global trade partners.`}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Institutional Trade Summary */}
      <section className="bg-slate-900 text-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-300 font-semibold mb-2">
            For Procurement Teams & Trade Partners
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-8 flex items-center gap-3">
            <Globe className="size-7 text-sky-300" />
            Institutional Trade Summary
          </h2>
          <div className="rounded-2xl border border-slate-700 overflow-hidden">
            <dl className="divide-y divide-slate-800">
              {factSheet.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 px-5 py-4 odd:bg-slate-800/40"
                >
                  <dt className="text-sm font-semibold text-slate-400">
                    {row.label}
                  </dt>
                  <dd className="sm:col-span-2 text-sm text-white">
                    {row.href ? (
                      <a
                        href={row.href}
                        className="text-sky-300 hover:text-sky-200 inline-flex items-center gap-1.5"
                      >
                        {row.label.includes("Email") && (
                          <Mail className="size-3.5" />
                        )}
                        {row.value}
                      </a>
                    ) : (
                      row.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </>
  );
}
