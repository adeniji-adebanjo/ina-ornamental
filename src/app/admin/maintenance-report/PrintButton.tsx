"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrintButton() {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => window.print()}
      className="rounded-xl print:hidden"
    >
      <Printer className="size-4 mr-2" aria-hidden />
      Print / save as PDF
    </Button>
  );
}
