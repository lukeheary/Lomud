"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollRestoration() {
  const pathname = usePathname();

  useEffect(() => {
    // Disable browser's automatic scroll restoration
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const shouldSkipScrollToTop = () => window.location.hash.length > 0;

    const forceTop = () => {
      if (shouldSkipScrollToTop()) return;
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };

    // Run multiple times to avoid mobile browsers restoring stale positions
    forceTop();
    requestAnimationFrame(() => {
      forceTop();
      requestAnimationFrame(forceTop);
    });

    const timeoutId = window.setTimeout(forceTop, 120);
    const onPageShow = () => forceTop();

    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      window.clearTimeout(timeoutId);
    };
  }, [pathname]);

  return null;
}
