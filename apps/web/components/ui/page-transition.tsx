"use client";

import { ReactNode } from "react";

/**
 * Wraps page content with a smooth fade+slide entrance animation.
 * Use in layouts or directly on pages for polished transitions.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <div className="page-enter">
      {children}
    </div>
  );
}
