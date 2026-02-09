"use client";

import { ReactNode, useRef, useEffect, useState } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface OverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  type?: "drawer" | "bottomSheet";
  position?: "left" | "right"; // drawer side
  width?: string; // e.g. "w-80"
  snapPoints?: number[]; // e.g., [0.3, 0.5, 0.9] = 30%, 50%, 90% of viewport
  header?: ReactNode;
  footer?: ReactNode;
  showCloseButton?: boolean;
}

export function Overlay({
  isOpen,
  onClose,
  children,
  type = "bottomSheet",
  position = "right",
  width = "w-96",
  snapPoints = [0.3, 0.5, 0.9],
  header,
  footer,
  showCloseButton = true,
}: OverlayProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [snapIndex, setSnapIndex] = useState(1); // default middle snap
  const [closing, setClosing] = useState(false);

  useFocusTrap(ref as React.RefObject<HTMLElement>, isOpen, onClose);

  // Prevent background scroll
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "");
  }, [isOpen]);

  if (!isOpen && !closing) return null;

  const drawerPosition = position === "left" ? "left-0" : "right-0";
  const panelClasses =
    type === "drawer"
      ? `${drawerPosition} top-0 ${width} h-full transform animate-drawer-slide`
      : `bottom-0 left-0 w-full rounded-t-xl transform animate-bottom-slide`;

  // Drag handlers
  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (type !== "bottomSheet") return;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setDragStart(clientY);
  };

  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (dragStart === null) return;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const offset = clientY - dragStart;
    setDragOffset(offset);
  };

  const handleDragEnd = () => {
    if (type !== "bottomSheet") return;

    const panelHeight = ref.current?.offsetHeight || 0;
    const windowHeight = window.innerHeight;

    // Compute absolute snap positions
    const snapPositions = snapPoints.map((p) => windowHeight * (1 - p));

    // Current top of panel relative to viewport
    const currentTop = (ref.current?.getBoundingClientRect().top || 0) + dragOffset;

    // Find nearest snap point
    const distances = snapPositions.map((pos) => Math.abs(currentTop - pos));
    const nearestIndex = distances.indexOf(Math.min(...distances));

    if (nearestIndex === 0 && dragOffset > 50) {
      // Close if dragged below first snap
      setClosing(true);
      setTimeout(onClose, 200);
    } else {
      setSnapIndex(nearestIndex);
    }

    setDragStart(null);
    setDragOffset(0);
  };

  const getTranslateY = () => {
    if (type !== "bottomSheet") return 0;
    if (closing) return window.innerHeight;
    const windowHeight = window.innerHeight;
    const snapY = windowHeight * (1 - snapPoints[snapIndex]);
    return snapY;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${
          closing ? "opacity-0" : "opacity-100"
        }`}
        onClick={() => {
          setClosing(true);
          setTimeout(onClose, 200);
        }}
      ></div>

      {/* Panel */}
      <div
        ref={ref}
        className={`fixed z-50 surface-glass shadow-lg ${panelClasses}`}
        style={{
          transform:
            type === "bottomSheet"
              ? `translateY(${dragOffset + getTranslateY()}px)`
              : undefined,
          transition: dragStart ? "none" : "transform 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        {/* Header */}
        {(header || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 cursor-grab">
            {header && <div>{header}</div>}
            {showCloseButton && (
              <button
                onClick={() => {
                  setClosing(true);
                  setTimeout(onClose, 200);
                }}
                className="text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-4">{children}</div>

        {/* Footer */}
        {footer && <div className="p-4 border-t border-gray-200">{footer}</div>}
      </div>
    </>
  );
}
