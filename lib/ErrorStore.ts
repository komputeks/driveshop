// @/lib/ErrorStore.ts
import { writable } from "react";

export type ApiOverlayError = {
  time: string;
  label: string;
  message: string;
  route?: string;
  action?: string;
  payload?: string;
  response?: string;
  durationMs?: number;
  stack?: string;
  file?: string;
  line?: number;
  col?: number;
};

export const errorStore = writable<ApiOverlayError[]>([]);

export function pushError(err: ApiOverlayError) {
  errorStore.update(prev => [err, ...prev].slice(0, 25));
}