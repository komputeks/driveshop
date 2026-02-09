"use client";

import { useState } from "react";
import { Drawer } from "@/components/Drawer";

export default function Demo() {
  const [isOpen, setOpen] = useState(false);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        Open Drawer
      </button>

      <Drawer isOpen={isOpen} onClose={() => setOpen(false)}>
        <h2 className="text-xl font-bold mb-4">My Drawer</h2>
        <p>This is a slide-in drawer with focus trap and animations.</p>
        <button className="btn btn-secondary mt-4" onClick={() => setOpen(false)}>
          Close
        </button>
      </Drawer>
    </>
  );
}