"use client";

import { useSyncExternalStore } from "react";
import { ErrorStoreCore, ApiOverlayError } from "./ErrorStoreCore";

/**
 * Single shared core instance
 */
const core = new ErrorStoreCore();

/**
 * React-friendly store wrapper
 */
export const errorStore = {
  push: (e: ApiOverlayError) => core.push(e),

  subscribe: (listener: (e: ApiOverlayError[]) => void) =>
    core.subscribe(listener),

  useErrors() {
    return useSyncExternalStore(
      core.subscribe.bind(core),
      core.getSnapshot.bind(core)   // ✅ correct method
    );
  },
};

export type { ApiOverlayError };