"use client";

import { useRef, useState } from "react";
import { Modal } from "@/components/overlays/Modal";
import { Drawer } from "@/components/overlays/Drawer";
import { Popover } from "@/components/overlays/Popover";
import { Toast } from "@/components/overlays/Toast";

export default function OverlayDemo() {
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [toast, setToast] = useState(false);
  const [popover, setPopover] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="p-8 space-y-4">
      <button className="btn btn-primary" onClick={() => setModal(true)}>
        Open Modal
      </button>

      <button className="btn btn-secondary" onClick={() => setDrawer(true)}>
        Open Drawer
      </button>

      <button
        ref={btnRef}
        className="btn btn-ghost"
        onClick={() => setPopover((v) => !v)}
      >
        Toggle Popover
      </button>

      <button className="btn btn-danger" onClick={() => setToast(true)}>
        Show Toast
      </button>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Modal">
        Modal content here
      </Modal>

      <Drawer isOpen={drawer} onClose={() => setDrawer(false)}>
        Drawer content here
      </Drawer>

      <Popover
        isOpen={popover}
        onClose={() => setPopover(false)}
        anchorRef={btnRef}
      >
        <div className="surface-card">Popover content</div>
      </Popover>

      {toast && (
        <div className="toast-container">
          <Toast message="Action completed" onClose={() => setToast(false)} />
        </div>
      )}
    </div>
  );
}