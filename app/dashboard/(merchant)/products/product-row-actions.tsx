"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import { deleteProduct, setProductActive } from "./actions";

interface ProductActiveToggleProps {
  productId: string;
  isActive: boolean;
  title: string;
}

export const ProductActiveToggle = ({ productId, isActive, title }: ProductActiveToggleProps) => {
  const [optimisticActive, setOptimisticActive] = useOptimistic(isActive);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleChange = (checked: boolean): void => {
    setError(null);
    startTransition(async () => {
      setOptimisticActive(checked);
      const result = await setProductActive({ id: productId, isActive: checked });
      if (result.error) setError(result.error);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={optimisticActive}
        onCheckedChange={handleChange}
        aria-label={`Visible en la tienda: ${title}`}
      />
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
};

interface ProductRowActionsProps {
  productId: string;
  title: string;
}

export const ProductRowActions = ({ productId, title }: ProductRowActionsProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (): void => {
    setError(null);
    startTransition(async () => {
      const result = await deleteProduct({ id: productId });
      if (result.error) setError(result.error);
      setIsOpen(false);
    });
  };

  return (
    <div className="flex items-center justify-end gap-1">
      {error && <span className="text-xs text-destructive">{error}</span>}
      <Link
        href={`/dashboard/products/${productId}/edit`}
        className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
        aria-label={`Editar ${title}`}
      >
        <Pencil />
      </Link>
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogTrigger
          render={
            <Button variant="ghost" size="icon-sm" disabled={isPending} aria-label={`Eliminar ${title}`}>
              <Trash2 />
            </Button>
          }
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará «{title}» y sus fotos. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Eliminando…" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
