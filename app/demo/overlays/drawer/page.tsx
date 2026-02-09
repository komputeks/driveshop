"use client";

import { useState } from "react";
import { Overlay } from "@/components/Overlays";

export default function Demo() {
  // State for bottom sheet
  const [isSheetOpen, setSheetOpen] = useState(false);

  // State for drawers
  const [isLeftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [isRightDrawerOpen, setRightDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <h1 className="text-2xl font-bold">Overlay Demo</h1>

      {/* Buttons to open overlays */}
      <div className="flex flex-wrap gap-4">
        <button
          className="btn btn-primary"
          onClick={() => setSheetOpen(true)}
        >
          Open Bottom Sheet
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => setLeftDrawerOpen(true)}
        >
          Open Left Drawer
        </button>

        <button
          className="btn btn-ghost"
          onClick={() => setRightDrawerOpen(true)}
        >
          Open Right Drawer
        </button>
      </div>

      {/* Bottom Sheet */}
      <Overlay
        isOpen={isSheetOpen}
        onClose={() => setSheetOpen(false)}
        type="bottomSheet"
        snapPoints={[0.3, 0.5, 0.9]}
        header={<div className="font-semibold text-lg">Bottom Sheet Header</div>}
      >
        <div className="space-y-4">
          <p>
            This is the content of the bottom sheet. You can drag it up or down
            between snap points!
          </p>
          <button className="btn btn-primary">Confirm</button>
        </div>
      </Overlay>

      {/* Left Drawer */}
      <Overlay
        type="drawer"
        position="left"
        width="w-80"
        isOpen={isLeftDrawerOpen}
        onClose={() => setLeftDrawerOpen(false)}
        header={<div className="font-semibold">Left Drawer</div>}
      >
        <div className="p-4 space-y-3">
          <p>This is a left drawer.</p>
          <button
            className="btn btn-primary"
            onClick={() => setLeftDrawerOpen(false)}
          >
            Close Drawer
          </button>
        </div>
      </Overlay>

      {/* Right Drawer */}
      <Overlay
        type="drawer"
        position="right"
        width="w-96"
        isOpen={isRightDrawerOpen}
        onClose={() => setRightDrawerOpen(false)}
        header={<div className="font-semibold">Right Drawer</div>}
      >
        <div className="p-4 space-y-3">
          <p>This is a right drawer.</p>
          <button
            className="btn btn-primary"
            onClick={() => setRightDrawerOpen(false)}
          >
            Close Drawer
          </button>
        </div>
      </Overlay>
    </div>
  );
}