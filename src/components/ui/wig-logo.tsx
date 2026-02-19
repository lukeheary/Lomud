import Link from "next/link";
import { truculenta } from "@/lib/fonts";

interface WigLogoProps {
  asLink?: boolean;
  href?: string;
}

export function WigLogo({ asLink = true, href = "/home" }: WigLogoProps) {
  const inner = (
    <span className={"flex items-baseline gap-1"}>
      <span
        className={`${truculenta.className} text-4xl font-black tracking-wide`}
      >
        WIG
      </span>
      <span className="text-sm font-light tracking-wide opacity-50">beta</span>
    </span>
  );

  if (asLink) {
    return <Link href={href}>{inner}</Link>;
  }

  return <div>{inner}</div>;
}
