"use client";

import { useEffect } from "react";

export function ScrollRestoration() {
  useEffect(() => {
    // Disable browser's automatic scroll restoration
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // Scroll to top on initial load
    window.scrollTo(0, 0);
  }, []);

  return null;
}
