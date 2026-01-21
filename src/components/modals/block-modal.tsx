"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/http";
import { getAccessToken } from "@/lib/session";

type BlockModalProps = {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUserName: string;
  isBlocked?: boolean;
  onBlockChange?: () => void;
};

export function BlockModal({
  isOpen,
  onClose,
  targetUserId,
  targetUserName,
  isBlocked = false,
  onBlockChange
}: BlockModalProps) {
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const handleBlock = async () => {
    setProcessing(true);
    const token = getAccessToken();

    const res = await apiFetch("/api/block", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        targetUserId,
        action: "BLOCK"
      })
    });

    setProcessing(false);

    if (res.ok) {
      onBlockChange?.();
      onClose();
    } else if (!res.ok) {
      alert(res.error || "Failed to block user");
    }
  };

  const handleUnblock = async () => {
    setProcessing(true);
    const token = getAccessToken();

    const res = await apiFetch("/api/block", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        targetUserId,
        action: "UNBLOCK"
      })
    });

    setProcessing(false);

    if (res.ok) {
      onBlockChange?.();
      onClose();
    } else if (!res.ok) {
      alert(res.error || "Failed to unblock user");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl border-2 border-violet-200 bg-white p-8 shadow-glow">
        <div className="mb-6 text-center">
          <div className="text-6xl mb-4">{isBlocked ? "🔓" : "🚫"}</div>
          <h2 className="font-display text-2xl text-ink-900 mb-2">
            {isBlocked ? "Unblock User" : "Block User"}
          </h2>
          <p className="text-ink-700">
            {isBlocked ? (
              <>
                Are you sure you want to unblock <span className="font-semibold">{targetUserName}</span>?
                You'll be able to see their events and messages again.
              </>
            ) : (
              <>
                Are you sure you want to block <span className="font-semibold">{targetUserName}</span>?
                You won't see their events or receive messages from them.
              </>
            )}
          </p>
        </div>

        <div className="space-y-3">
          {isBlocked ? (
            <Button
              onClick={handleUnblock}
              disabled={processing}
              className="w-full"
              variant="outline"
            >
              {processing ? "Unblocking..." : "Unblock User"}
            </Button>
          ) : (
            <Button
              onClick={handleBlock}
              disabled={processing}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {processing ? "Blocking..." : "Block User"}
            </Button>
          )}
          <Button
            onClick={onClose}
            disabled={processing}
            variant="outline"
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
