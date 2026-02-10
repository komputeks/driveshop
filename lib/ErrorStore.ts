// "use client"
// @/lib/ErrorStore.ts
"use client";

import { useSyncExternalStore } from "react";
import { ErrorStoreCore, ApiOverlayError } from "./ErrorStoreCore";

export const errorStore = new ErrorStoreCore();

/**
 * Optional helper hook to use overlay errors in React components
 */
export function useErrors(): ApiOverlayError[] {
  return useSyncExternalStore(
    errorStore.subscribe.bind(errorStore),
    errorStore.getAll.bind(errorStore)
  );
}