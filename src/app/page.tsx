import Link from "next/link";
import { fishProducts } from "@/data/products";

const features = [
  {
    title: "Ethically Sourced African Aquarium Fish",
    body: "Partnering with responsible breeders and collectors while prioritizing sustainable practices and fish well-being.",
  },
  {
    title: "Customized Logistics, Specialized Exotic Care",
    body: "Tailored global export operations with careful packing, live arrival focus, and smooth documentation workflows.",
  },
  {
    title: "Invested B2B Partnership",
    body: "Dedicated account support for wholesalers, retailers, and specialized collectors across global markets.",
  },
];

const stats = [
  { label: "Years of Experience", value: "22+" },
  { label: "Species Available", value: "120+" },
  { label: "Countries Reached", value: "30+" },
  { label: "Clients Served", value: "500+" },
];

export default function Home() {
  const featured = fishProducts.filter((p) => p.featured).slice(0, 6);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-sky-900 to-emerald-900 text-white">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_#10b981_0,_transparent_45%),radial-gradient(circle_at_bottom_left,_#0ea5e9_0,_transparent_40%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <p className="text-xs uppercase tracking-[0.25em] text-sky-200 font-semibold mb-4">
            INA Ornamental Fish | West African Ornamental Fish Exporter
          </p>
          <h1 className="text-4xl md:text-6xl font-black leading-[1.06] max-w-4xl">
            Bringing Africa's Rarest and Most Vibrant Species to the World
          </h1>
          <p className="mt-6 max-w-3xl text-sky-100 text-base md:text-lg leading-relaxed">
            Expert exporter and importer of premium West African ornamental
            fish. We specialize in bichirs, puffers, cichlids, tetras, catfish,
            and unique oddballs for B2B wholesale and retail aquarium markets.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/catalogue"
              className="inline-flex justify-center items-center bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Browse Catalogue
            </Link>
            <Link
              href="/order"
              className="inline-flex justify-center items-center bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl border border-white/20 transition-colors"
            >
              Start Order Request
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center"
            >
              <p className="text-2xl md:text-3xl font-black text-sky-800">
                {stat.value}
              </p>
              <p className="text-xs md:text-sm text-slate-500 mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900">
            Why Global Buyers Choose INA Export
          </h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm"
              >
                <h3 className="font-bold text-slate-900 leading-tight">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                  {feature.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-sky-700 font-semibold">
              Best Sellers
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
            <article
              key={fish.id}
              className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <p className="text-xs uppercase tracking-wider text-emerald-700 font-semibold">
                {fish.category}
              </p>
              <h3 className="text-lg font-bold text-slate-900 mt-1">
                {fish.commonName}
              </h3>
              <p className="text-sm italic text-sky-700">
                {fish.scientificName}
              </p>
              <p className="text-sm text-slate-500 mt-3 line-clamp-2">
                {fish.description}
              </p>
              <Link
                href="/order"
                className="mt-4 inline-flex text-sm font-semibold text-sky-700 hover:text-sky-600"
              >
                Add to Quote
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black">
              Need Live Inventory from WordPress?
            </h2>
            <p className="mt-2 text-slate-300 max-w-2xl">
              This app is prepared for headless WordPress integration so your
              team can manage products, categories, and stock status from a
              familiar CMS workflow.
            </p>
          </div>
          <Link
            href="/catalogue"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Explore Live Catalogue
          </Link>
        </div>
      </section>
    </>
  );
}
