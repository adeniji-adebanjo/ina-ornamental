"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, LayoutDashboard, RotateCcw } from "lucide-react";

export default function AdminError({
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
    <div className="flex items-center justify-center py-16">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertTriangle className="size-6" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">
          This page failed to load
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          There was a problem loading data for this section. Try again, and if
          the problem persists check the server logs.
        </p>
        {error.digest && (
          <p className="mt-3 text-xs text-slate-400">
            Error reference: <span className="font-mono">{error.digest}</span>
          </p>
        )}
        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2">
          <Link
            href="/admin"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "flex-1 rounded-xl gap-2",
            )}
          >
            <LayoutDashboard className="size-4" />
            Dashboard
          </Link>
          <Button
            onClick={() => unstable_retry()}
            className="flex-1 rounded-xl gap-2"
          >
            <RotateCcw className="size-4" />
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
