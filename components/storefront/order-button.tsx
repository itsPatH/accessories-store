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
  // The detail page passes false: linking to the page you are on is pointless.
  showProductLinkFallback?: boolean;
  // Two-column phone grids are ~160px wide: show "Pedir" there and keep the full label for screen readers.
  compactOnMobile?: boolean;
}

// v1 has no cart: orders go through WhatsApp. Until the number is configured it links to the product.
export const OrderButton = ({
  product,
  className,
  showProductLinkFallback = true,
  compactOnMobile = false,
}: OrderButtonProps) => {
  const productUrl = `/products/${product.id}`;
  const whatsappUrl = getWhatsAppUrl(
    `Hola, me interesa este producto: ${product.title} (${formatPrice(product.price)}) ${getSiteUrl()}${productUrl}`,
  );
  const classes = cn(buttonVariants({ size: "lg" }), "h-10 w-full rounded-full font-semibold", className);

  if (!whatsappUrl && !showProductLinkFallback) return null;

  return whatsappUrl ? (
    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={classes}>
      <WhatsAppIcon className="size-4" />
      <span>
        Pedir<span className={compactOnMobile ? "sr-only sm:not-sr-only" : undefined}> por WhatsApp</span>
      </span>
    </a>
  ) : (
    <Link href={productUrl} className={classes}>
      Ver producto
      <ArrowRight />
    </Link>
  );
};
