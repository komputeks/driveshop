"use client";

import { useState } from "react";
import { Modal, Drawer, Popover } from "@/components/Overlays";
import Image from "next/image";

export default function OverlaysDemoPage() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isPopoverOpen, setPopoverOpen] = useState(false);

  return (
    <main className="min-h-screen bg-bg text-fg p-6">
      <h1 className="text-2xl font-semibold mb-6">DriveShop Overlays Demo</h1>

      <div className="flex flex-wrap gap-4">
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          Open Profile Modal
        </button>

        <button className="btn btn-secondary" onClick={() => setDrawerOpen(true)}>
          Open Activity Drawer
        </button>

        <div className="relative">
          <button
            className="btn btn-ghost"
            onClick={() => setPopoverOpen(!isPopoverOpen)}
          >
            Actions ⌄
          </button>
          {isPopoverOpen && (
            <Popover>
              <ul className="p-2 space-y-1">
                <li>
                  <button className="btn btn-ghost w-full text-left" onClick={() => alert("Action 1")}>
                    Action 1
                  </button>
                </li>
                <li>
                  <button className="btn btn-ghost w-full text-left" onClick={() => alert("Action 2")}>
                    Action 2
                  </button>
                </li>
              </ul>
            </Popover>
          )}
        </div>
      </div>

      {/* ---------------- Modal ---------------- */}
      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)}>
        <div className="text-center space-y-4">
          <Image
            src="/avatar.png"
            width={96}
            height={96}
            alt="User"
            className="rounded-full mx-auto"
          />
          <h2 className="text-xl font-semibold">John Doe</h2>
          <p className="muted">john.doe@example.com</p>
          <button className="btn btn-primary" onClick={() => setModalOpen(false)}>
            Close
          </button>
        </div>
      </Modal>

      {/* ---------------- Drawer ---------------- */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)}>
        <div className="p-4 space-y-4">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <ul className="space-y-2">
            <li className="card p-2">Liked "Item A"</li>
            <li className="card p-2">Commented on "Item B"</li>
            <li className="card p-2">Liked "Item C"</li>
          </ul>
          <button className="btn btn-ghost w-full mt-4" onClick={() => setDrawerOpen(false)}>
            Close Drawer
          </button>
        </div>
      </Drawer>
    </main>
  );
}