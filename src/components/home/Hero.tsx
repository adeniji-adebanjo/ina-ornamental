import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-linear-to-br from-slate-900 via-sky-900 to-emerald-900 text-white">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,#d4a85f_0,transparent_45%),radial-gradient(circle_at_bottom_left,#3b655d_0,transparent_40%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <p className="text-xs uppercase tracking-[0.25em] text-sky-200 font-semibold mb-4">
          West Africa&apos;s Leading Ornamental Fish Exporter
        </p>
        <h1 className="text-4xl md:text-6xl font-black leading-[1.06] max-w-4xl">
          Premium African Species, Delivered Worldwide
        </h1>
        <p className="mt-6 max-w-3xl text-sky-100 text-base md:text-lg leading-relaxed">
          160+ freshwater species — bichirs, puffers, cichlids, tetras, catfish,
          and rare oddballs — ethically sourced and export-ready. Trusted by
          wholesalers and collectors across 30+ countries.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href="/catalogue"
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl",
            )}
          >
            Browse Catalogue
          </Link>
          <Link
            href="/order"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "bg-white/10 hover:bg-white/25 text-white hover:text-white font-semibold rounded-xl border-white/30",
            )}
          >
            Start Order Request
          </Link>
        </div>
      </div>
    </section>
  );
}
