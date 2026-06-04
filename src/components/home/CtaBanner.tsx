import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CtaBanner() {
  return (
    <section className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black">
            Ready to Stock Premium African Species?
          </h2>
          <p className="mt-2 text-slate-300 max-w-2xl">
            Browse our live catalogue of 160+ species, build your order with
            multiple shipment groups, and receive a detailed proforma invoice —
            all in minutes.
          </p>
        </div>
        <Link
          href="/order"
          className={cn(
            buttonVariants({ size: "lg" }),
            "bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl",
          )}
        >
          Start Your Order
        </Link>
      </div>
    </section>
  );
}
