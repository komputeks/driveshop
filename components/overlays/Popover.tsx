"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

interface PopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: ReactNode;
}

export function Popover({
  isOpen,
  onClose,
  anchorRef,
  children,
}: PopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  // Position popover
  useEffect(() => {
    if (!isOpen || !anchorRef.current) return;

    const rect = anchorRef.current.getBoundingClientRect();

    setStyle({
      position: "absolute",
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
      zIndex: 50,
    });
  }, [isOpen, anchorRef]);

  // Outside click
  useEffect(() => {
    if (!isOpen) return;

    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node;

      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return (
    <div ref={popoverRef} style={style}>
      {children}
    </div>
  );
}