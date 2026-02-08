// components/ToastProvider.tsx
"use client";
import { createContext, useContext, useState, ReactNode } from "react";

interface Toast {
  id: string;
  message: string;
  type?: "success" | "info" | "warning" | "danger";
}

const ToastContext = createContext({
  toasts: [] as Toast[],
  addToast: (toast: Toast) => {},
  removeToast: (id: string) => {}
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Toast) => {
    setToasts((prev) => [...prev, toast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-md px-4 py-2 shadow ${
              t.type === "success"
                ? "bg-green-600 text-white"
                : t.type === "danger"
                ? "bg-red-600 text-white"
                : t.type === "warning"
                ? "bg-yellow-500 text-black"
                : "bg-blue-600 text-white"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);