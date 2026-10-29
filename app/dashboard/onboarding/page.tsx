import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile, requireUser } from "@/lib/auth";

import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = {
  title: "Abre tu tienda",
};

export default async function OnboardingPage() {
  await requireUser();
  const profile = await getCurrentProfile();
  if (profile?.role === "merchant") redirect("/dashboard");

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Abre tu tienda</CardTitle>
        <CardDescription>Elige un nombre para tu tienda y empieza a publicar tus accesorios.</CardDescription>
      </CardHeader>
      <CardContent>
        <OnboardingForm />
      </CardContent>
    </Card>
  );
}
