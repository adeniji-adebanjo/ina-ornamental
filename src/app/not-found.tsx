import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Home, BookOpen, Fish } from "lucide-react";

export default function NotFound() {
  return (
    <section className="flex-1 flex items-center justify-center px-4 py-16 md:py-24">
      <Card className="max-w-lg w-full text-center border-slate-100 rounded-2xl shadow-sm">
        <CardContent className="p-8 md:p-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-sky-50 mb-6">
            <Fish className="size-10 text-sky-700" />
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-sky-800 leading-none">
            404
          </h1>
          <h2 className="mt-3 text-xl md:text-2xl font-bold text-slate-900">
            Page Not Found
          </h2>
          <p className="mt-3 text-slate-500 text-sm md:text-base leading-relaxed max-w-md mx-auto">
            The page you&apos;re looking for seems to have swum away. It may
            have been moved, removed, or the URL might be incorrect.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-sky-800 hover:bg-sky-700 text-white rounded-xl gap-2",
              )}
            >
              <Home className="size-4" />
              Back to Home
            </Link>
            <Link
              href="/catalogue"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "rounded-xl border-slate-200 text-slate-700 gap-2",
              )}
            >
              <BookOpen className="size-4" />
              Browse Catalogue
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
