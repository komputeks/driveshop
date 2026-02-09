"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  return (
    <div className="toast">
      <span>{message}</span>
      <button onClick={onClose} className="toast-close">✕</button>
    </div>
  );
}




// <div className="toast-container">
//   <Toast message="Saved!" onClose={() => setShow(false)} />
// </div>