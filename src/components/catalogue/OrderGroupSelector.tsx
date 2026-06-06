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
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          Adding to Group:
        </p>
        <div className="flex items-center gap-2">
          {totalItems > 0 && (
            <Link href="/order">
              <Badge className="bg-sky-700 text-white cursor-pointer hover:bg-sky-600">
                <ShoppingCart className="size-3 mr-1" />
                {totalItems} items
              </Badge>
            </Link>
          )}
          <Button
            onClick={handleAddGroup}
            variant="ghost"
            size="sm"
            className="text-emerald-700 hover:bg-emerald-50 h-7 px-2"
          >
            <FolderPlus className="size-3.5 mr-1" />
            New Group
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {orderGroups.map((group) => {
          const groupCount = cart.filter((i) => i.group === group).length;
          return (
            <Button
              key={group}
              onClick={() => setActiveOrderGroup(group)}
              variant={activeOrderGroup === group ? "default" : "outline"}
              size="sm"
              className={`rounded-full text-xs ${
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
      </div>
    </div>
  );
}
