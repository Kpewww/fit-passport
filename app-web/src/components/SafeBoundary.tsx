"use client";

// A minimal error boundary.
//
// Why this exists: a `lazy()` component inside `<Suspense>` with no boundary is a
// trap — if the chunk fails to load or the component throws on mount (a WebGL
// context that can't be created, say), React tears down the subtree and the user
// gets a blank area or a crashed page with no explanation. Anything optional and
// heavy (the 3D badge renderer) is wrapped in this so a failure degrades to a
// fallback instead of disappearing.

import { Component, type ReactNode } from "react";

export class SafeBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    // Not silent: a swallowed failure is how "it just doesn't work" bugs survive.
    console.warn("[SafeBoundary] subtree failed, using fallback:", error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
