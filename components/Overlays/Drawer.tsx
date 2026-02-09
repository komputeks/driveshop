"use client";

import { ReactNode, useRef } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Optional: additional classes for drawer panel */
  className?: string;
}

/**
 * Side Drawer component
 * Slides in from the right with focus trap and backdrop handling
 */
export function Drawer({ isOpen, onClose, children, className = "" }: DrawerProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Trap focus when drawer is open
  useFocusTrap(ref, isOpen, onClose);

  return (
    // Backdrop
    <div
      className={`fixed inset-0 z-50 transition-opacity ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      } bg-black/40`}
      onClick={onClose}
    >
      {/* Drawer panel */}
      <div
        ref={ref}
        className={`
          fixed top-0 right-0 h-full w-80 sm:w-96 bg-white dark:bg-slate-950 shadow-xl
          transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "translate-x-full"}
          overflow-auto
          ${className}
        `}
        onClick={(e) => e.stopPropagation()} // prevent backdrop click from closing
      >
        {children}
      </div>
    </div>
  );
}