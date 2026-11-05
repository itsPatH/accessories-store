import {
  BatteryCharging,
  Cable,
  Ellipsis,
  Headphones,
  PlugZap,
  ShieldCheck,
  Smartphone,
  TabletSmartphone,
  type LucideIcon,
} from "lucide-react";

import type { ProductCategory } from "@/types/database";

export const PRODUCT_CATEGORY_ICONS: Record<ProductCategory, LucideIcon> = {
  case: Smartphone,
  screen_protector: ShieldCheck,
  charger: PlugZap,
  cable: Cable,
  headphones: Headphones,
  power_bank: BatteryCharging,
  mount: TabletSmartphone,
  other: Ellipsis,
};
