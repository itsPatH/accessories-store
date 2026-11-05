import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { WhatsAppIcon } from "@/components/brand/social-icons";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { getSiteUrl, getWhatsAppUrl } from "@/lib/site-config";
import { cn } from "@/lib/utils";

interface OrderButtonProps {
  product: { id: string; title: string; price: number };
  className?: string;
}

// v1 has no cart: orders go through WhatsApp. Until the number is configured it links to the product.
export const OrderButton = ({ product, className }: OrderButtonProps) => {
  const productUrl = `/products/${product.id}`;
  const whatsappUrl = getWhatsAppUrl(
    `Hola, me interesa este producto: ${product.title} (${formatPrice(product.price)}) ${getSiteUrl()}${productUrl}`,
  );
  const classes = cn(buttonVariants({ size: "lg" }), "h-10 w-full rounded-full font-semibold", className);

  return whatsappUrl ? (
    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={classes}>
      <WhatsAppIcon className="size-4" />
      Pedir por WhatsApp
    </a>
  ) : (
    <Link href={productUrl} className={classes}>
      Ver producto
      <ArrowRight />
    </Link>
  );
};
