import { z } from "zod";

export const storeNameSchema = z
  .string()
  .trim()
  .min(2, "El nombre de la tienda debe tener al menos 2 caracteres")
  .max(80, "El nombre de la tienda no puede superar 80 caracteres");

export const signUpSchema = z
  .object({
    email: z.email("Ingresa un email válido").trim().toLowerCase(),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .max(72, "La contraseña no puede superar 72 caracteres"),
    displayName: z
      .string()
      .trim()
      .min(1, "Ingresa tu nombre")
      .max(80, "El nombre no puede superar 80 caracteres"),
    accountType: z.enum(["customer", "merchant"]),
    storeName: z.string().trim().optional(),
  })
  .superRefine((value, context) => {
    if (value.accountType !== "merchant") return;
    const result = storeNameSchema.safeParse(value.storeName ?? "");
    if (!result.success) {
      context.addIssue({
        code: "custom",
        path: ["storeName"],
        message: result.error.issues[0]?.message ?? "Nombre de tienda inválido",
      });
    }
  });

export const signInSchema = z.object({
  email: z.email("Ingresa un email válido").trim().toLowerCase(),
  password: z.string().min(1, "Ingresa tu contraseña"),
  next: z.string().optional(),
});

export const becomeMerchantSchema = z.object({
  storeName: storeNameSchema,
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
