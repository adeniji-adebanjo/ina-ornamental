"use client";

import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { useStore } from "@/store/useStore";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Load the persisted cart from localStorage after the first client render so
  // server and client markup match (the store uses skipHydration).
  useEffect(() => {
    useStore.persist.rehydrate();
  }, []);

  return (
    <>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
