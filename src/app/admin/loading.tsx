import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-3 py-24 text-slate-500"
    >
      <Loader2 className="size-5 animate-spin text-sky-700" />
      <span className="text-sm font-medium">Loading&hellip;</span>
    </div>
  );
}
