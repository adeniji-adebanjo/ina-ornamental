"use client";

import { useStore } from "@/store/useStore";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function SearchBar() {
  const { searchQuery, setSearchQuery } = useStore();

  return (
    <div className="relative">
      <Search className="size-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
      <Input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search by common name, scientific name, category..."
        className="w-full pl-12 pr-4 h-12 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
      />
    </div>
  );
}
