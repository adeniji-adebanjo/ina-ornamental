"use client";

import { useStore } from "@/store/useStore";

export default function SearchBar() {
  const { searchQuery, setSearchQuery } = useStore();

  return (
    <div className="relative">
      <svg
        className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
        />
      </svg>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search by common name, scientific name, category..."
        className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
      />
    </div>
  );
}
