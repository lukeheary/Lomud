import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BackButtonHeaderProps = {
  title?: string;
  subtitle?: string;
  backHref?: string;
  onBack?: () => void;
  backLabel?: string;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  children?: React.ReactNode;
};

export function BackButtonHeader({
  title,
  subtitle,
  backHref,
  onBack,
  backLabel = "Back",
  className,
  titleClassName,
  subtitleClassName,
  children,
}: BackButtonHeaderProps) {
  const showBack = Boolean(backHref || onBack);

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {showBack ? (
        backHref ? (
          <Button asChild variant="ghost" size="icon" aria-label={backLabel}>
            <Link href={backHref}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            aria-label={backLabel}
            onClick={onBack}
            type="button"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )
      ) : null}

      <div className="min-w-0">
        {children ? (
          children
        ) : (
          <div className="space-y-1">
            {title ? (
              <h1
                className={cn(
                  "text-2xl font-bold tracking-tight md:text-3xl",
                  titleClassName
                )}
              >
                {title}
              </h1>
            ) : null}
            {subtitle ? (
              <p className={cn("text-muted-foreground", subtitleClassName)}>
                {subtitle}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
