import type { Metadata } from "next";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireMerchant } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Panel",
};

// Product management lands with .specs/04-products-crud.md.
export default async function DashboardPage() {
  const { profile } = await requireMerchant();

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Hola, {profile.display_name ?? profile.store_name}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{profile.store_name}</CardTitle>
          <CardDescription>
            Tu tienda está lista. Pronto podrás publicar y gestionar tus productos desde aquí.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
