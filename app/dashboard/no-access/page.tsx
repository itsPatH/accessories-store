import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Clock } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile, requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Acceso pendiente",
};

// Merchant access is granted by the admin (.specs/03-auth-flow.md §3.5); there is no self-service form.
export default async function NoAccessPage() {
  await requireUser();
  const profile = await getCurrentProfile();
  if (profile?.role === "merchant") redirect("/dashboard");

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <Clock className="mb-2 size-6 text-muted-foreground" />
        <CardTitle>Acceso pendiente</CardTitle>
        <CardDescription>
          Tu cuenta todavía no tiene permiso para administrar la tienda. Pide al administrador que la habilite y
          vuelve a entrar.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
