// @/lib/ErrorStore.ts
"use client";

import { useSyncExternalStore } from "react";
import { ErrorStoreCore, ApiOverlayError } from "./ErrorStoreCore";

/**
 * Single shared store instance
 */
export const errorStore = new ErrorStoreCore();

/**
 * Hook for client-side reactive UI (ErrorCatcher)
 */
export function useErrorStore() {
  return useSyncExternalStore(
    errorStore.subscribe.bind(errorStore),
    () => errorStore.getAll()
  );
}