// @/lib/ErrorStoreCore.ts
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

type Listener = (errors: ApiOverlayError[]) => void;

export class ErrorStoreCore {
  private errors: ApiOverlayError[] = [];
  private listeners = new Set<Listener>();

  push(error: ApiOverlayError) {
    this.errors = [error, ...this.errors].slice(0, 25);
    this.listeners.forEach((listener) => listener(this.errors));
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.errors); // immediate initial call
    return () => this.listeners.delete(listener);
  }

  getAll() {
    return [...this.errors];
  }
}