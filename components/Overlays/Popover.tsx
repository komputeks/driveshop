"use client";

import { ReactNode } from "react";

interface PopoverProps {
  children: ReactNode;
  className?: string;
}

export function Popover({ children, className }: PopoverProps) {
  return (
    <div className={`popover ${className ?? ""}`}>
      {children}
    </div>
  );
}