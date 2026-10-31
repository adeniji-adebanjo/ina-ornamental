"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="flex-1 flex items-center justify-center px-4 py-16 md:py-24">
      <Card className="max-w-lg w-full text-center border-slate-100 rounded-2xl shadow-sm">
        <CardContent className="p-8 md:p-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-50 mb-6">
            <AlertTriangle className="size-10 text-amber-600" />
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-slate-900">
            Something went wrong
          </h1>
          <p className="mt-3 text-slate-500 text-sm md:text-base leading-relaxed max-w-md mx-auto">
            We couldn&apos;t load this page right now. This is usually
            temporary &mdash; please try again in a moment.
          </p>
          {error.digest && (
            <p className="mt-3 text-xs text-slate-400">
              Reference: <span className="font-mono">{error.digest}</span>
            </p>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="rounded-xl gap-2"
              onClick={() => unstable_retry()}
            >
              <RotateCcw className="size-4" />
              Try again
            </Button>
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "rounded-xl border-slate-200 text-slate-700 gap-2",
              )}
            >
              <Home className="size-4" />
              Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
