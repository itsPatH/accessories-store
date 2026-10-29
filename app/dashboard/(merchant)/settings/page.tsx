import type { Metadata } from "next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireMerchant } from "@/lib/auth";

import { SettingsForm } from "./settings-form";

export const metadata: Metadata = {
  title: "Ajustes de tienda",
};

export default async function SettingsPage() {
  const { profile } = await requireMerchant();

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle>Ajustes de tienda</CardTitle>
        <CardDescription>Esta información es pública en tu página de tienda.</CardDescription>
      </CardHeader>
      <CardContent>
        <SettingsForm profile={profile} />
      </CardContent>
    </Card>
  );
}
