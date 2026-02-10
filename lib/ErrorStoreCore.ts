// @/lib/ErrorStoreCore.ts
import { ApiOverlayError } from "./types"; // optionally move ApiOverlayError to a separate types file

type Listener = (errors: ApiOverlayError[]) => void;

/**
 * Pure error store — works on server and client.
 */
export class ErrorStoreCore {
  private errors: ApiOverlayError[] = [];
  private listeners = new Set<Listener>();

  push(error: ApiOverlayError) {
    this.errors = [error, ...this.errors].slice(0, 25);
    this.listeners.forEach((l) => l(this.errors));
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.errors); // initial
    return () => this.listeners.delete(listener);
  }

  getAll() {
    return [...this.errors];
  }
}