"use client";

import { ReactNode, useEffect, useRef } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: ReactNode;
}

export function Modal({ isOpen, onClose, children, title }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          ref={ref}
          className="surface-card w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {(title || onClose) && (
            <div className="flex items-center justify-between mb-4">
              {title && <h3>{title}</h3>}
              <button onClick={onClose} className="btn-ghost">✕</button>
            </div>
          )}
          {children}
        </div>
      </div>
    </>
  );
}