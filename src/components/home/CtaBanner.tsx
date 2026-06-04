import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CtaBanner() {
  return (
    <section className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black">
            Need Live Inventory from WordPress?
          </h2>
          <p className="mt-2 text-slate-300 max-w-2xl">
            This app is prepared for headless WordPress integration so your team
            can manage products, categories, and stock status from a familiar
            CMS workflow.
          </p>
        </div>
        <Link
          href="/catalogue"
          className={cn(
            buttonVariants({ size: "lg" }),
            "bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl",
          )}
        >
          Explore Live Catalogue
        </Link>
      </div>
    </section>
  );
}
