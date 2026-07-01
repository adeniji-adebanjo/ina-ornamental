"use client";

import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderPlus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function OrderGroupSelector() {
  const {
    orderGroups,
    activeOrderGroup,
    setActiveOrderGroup,
    addOrderGroup,
    cart,
  } = useStore();

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddGroup = () => {
    const letter = String.fromCharCode(65 + orderGroups.length);
    const name = `Order ${letter}`;
    addOrderGroup(name);
    toast.success(`Created "${name}" — items will now be added here`);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">
        Adding to
      </span>
      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
        {orderGroups.map((group) => {
          const groupCount = cart.filter((i) => i.group === group).length;
          return (
            <Button
              key={group}
              onClick={() => setActiveOrderGroup(group)}
              variant={activeOrderGroup === group ? "default" : "outline"}
              size="sm"
              className={`rounded-full h-7 px-3 text-xs ${
                activeOrderGroup === group
                  ? "bg-sky-700 text-white"
                  : "border-slate-200"
              }`}
            >
              {group}
              {groupCount > 0 && (
                <span className="ml-1 text-[10px] opacity-75">
                  ({groupCount})
                </span>
              )}
            </Button>
          );
        })}
        <Button
          onClick={handleAddGroup}
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-emerald-700 hover:bg-emerald-50"
        >
          <FolderPlus className="size-3.5 mr-1" />
          New
        </Button>
      </div>
      {totalItems > 0 && (
        <Link href="/order" className="ml-auto shrink-0">
          <Badge className="bg-sky-700 text-white cursor-pointer hover:bg-sky-600">
            <ShoppingCart className="size-3 mr-1" />
            {totalItems} items
          </Badge>
        </Link>
      )}
    </div>
  );
}
