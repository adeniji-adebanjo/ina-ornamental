"use client";

import { Button } from "@/components/ui/button";
import {
  ConfirmDialog,
  useConfirmDialog,
} from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { BlogCategory } from "@/types";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCategories: BlogCategory[];
}

export default function CategoryManager({
  open,
  onOpenChange,
  initialCategories,
}: Props) {
  const router = useRouter();
  const [categories, setCategories] = useState<BlogCategory[]>(initialCategories);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmProps, showConfirm] = useConfirmDialog();

  // Re-read the list from WordPress and keep the parent page in sync. Called
  // after every mutation so the manager always reflects the latest state.
  async function refresh() {
    try {
      const res = await fetch("/api/admin/blog/categories");
      if (res.ok) setCategories(await res.json());
    } catch {
      /* keep current list */
    }
    router.refresh();
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/blog/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Category "${name}" created`);
        setNewName("");
        await refresh();
      } else {
        toast.error(data.error || "Failed to create category");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setCreating(false);
    }
  }

  async function handleRename(id: number) {
    const name = editName.trim();
    if (!name) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/blog/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Category renamed");
        setEditingId(null);
        await refresh();
      } else {
        toast.error(data.error || "Failed to rename category");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setBusyId(null);
    }
  }

  function handleDelete(cat: BlogCategory) {
    showConfirm({
      title: `Delete "${cat.name}"?`,
      description:
        "Posts in this category will not be deleted, but they will lose this category.",
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        setBusyId(cat.id);
        try {
          const res = await fetch(`/api/admin/blog/categories/${cat.id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            toast.success(`"${cat.name}" deleted`);
            await refresh();
          } else {
            const data = await res.json().catch(() => ({}));
            toast.error(data.error || "Failed to delete category");
          }
        } finally {
          setBusyId(null);
        }
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Blog categories</DialogTitle>
          <DialogDescription>
            Create, rename or remove the categories used to organise posts.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            aria-label="New category name"
            placeholder="New category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
            className="rounded-lg"
          />
          <Button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="rounded-lg shrink-0"
            aria-label="Add category"
          >
            {creating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
          </Button>
        </div>

        <div className="max-h-72 overflow-y-auto -mx-1 px-1 space-y-1">
          {categories.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              No categories yet.
            </p>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-2 rounded-lg border border-slate-100 px-2.5 py-1.5"
              >
                {editingId === cat.id ? (
                  <>
                    <Input
                      aria-label={`Rename ${cat.name}`}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(cat.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      autoFocus
                      className="h-7 rounded-md"
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={busyId === cat.id}
                      onClick={() => handleRename(cat.id)}
                      aria-label="Save category name"
                    >
                      <Check className="size-4 text-emerald-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setEditingId(null)}
                      aria-label="Cancel rename"
                    >
                      <X className="size-4 text-slate-500" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-slate-800 truncate">
                      {cat.name}
                      <span className="ml-1.5 text-xs text-slate-400">
                        ({cat.count})
                      </span>
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Rename"
                      aria-label={`Rename ${cat.name}`}
                      onClick={() => {
                        setEditingId(cat.id);
                        setEditName(cat.name);
                      }}
                    >
                      <Pencil className="size-3.5 text-slate-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Delete"
                      aria-label={`Delete ${cat.name}`}
                      disabled={busyId === cat.id}
                      onClick={() => handleDelete(cat)}
                    >
                      <Trash2 className="size-3.5 text-red-500" />
                    </Button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
      <ConfirmDialog {...confirmProps} />
    </Dialog>
  );
}
