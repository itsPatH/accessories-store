import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireMerchant } from "@/lib/auth";
import { getOwnProductStats } from "@/lib/products/merchant-queries";

export const metadata: Metadata = {
  title: "Panel",
};

export default async function DashboardPage() {
  const { user, profile } = await requireMerchant();
  const stats = await getOwnProductStats(user.id);

  const statCards = [
    { label: "Productos", value: stats.total },
    { label: "Visibles en la tienda", value: stats.active },
    { label: "Agotados", value: stats.outOfStock },
  ];

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{profile.store_name}</h1>
          <Link href={`/stores/${user.id}`} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            Ver mi tienda pública
          </Link>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/settings" className={buttonVariants({ variant: "outline" })}>
            Ajustes de tienda
          </Link>
          <Link href="/dashboard/products/new" className={buttonVariants()}>
            <Plus />
            Nuevo producto
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-3xl">{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Link href="/dashboard/products" className={buttonVariants({ variant: "outline", className: "w-fit" })}>
        Gestionar productos
      </Link>
    </div>
  );
}
