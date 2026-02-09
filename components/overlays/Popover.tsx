"use client";

import { ReactNode, useEffect, useRef } from "react";

interface PopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
  children: ReactNode;
}

export function Popover({ isOpen, onClose, anchorRef, children }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        !anchorRef.current?.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [onClose, anchorRef]);

  if (!isOpen) return null;

  return (
    <div ref={ref} className="popover-content">
      {children}
    </div>
  );
}