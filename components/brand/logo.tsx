import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface LogoProps {
  // "light" for dark backgrounds (header, footer), "dark" for light ones.
  tone?: "light" | "dark";
  size?: "md" | "lg";
  className?: string;
}

export const Logo = ({ tone = "light", size = "md", className }: LogoProps) => (
  <Link href="/" className={cn("flex items-center gap-2.5", className)} aria-label="Guaro Cell, inicio">
    <Image
      src="/images/logo-mark.png"
      alt=""
      width={size === "lg" ? 56 : 40}
      height={size === "lg" ? 56 : 40}
      priority
      className="rounded-full"
    />
    <span className={cn("font-extrabold tracking-tight", size === "lg" ? "text-3xl" : "text-2xl")}>
      <span className={tone === "light" ? "text-white" : "text-navy"}>Guaro</span>
      <span className="bg-linear-to-r from-brand to-brand-strong bg-clip-text text-transparent">Cell</span>
    </span>
  </Link>
);
