"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ReportModal } from "@/components/modals/report-modal";
import { BlockModal } from "@/components/modals/block-modal";

type UserActionsMenuProps = {
  userId: string;
  userName: string;
  currentUserId?: string;
  className?: string;
};

export function UserActionsMenu({
  userId,
  userName,
  currentUserId,
  className = ""
}: UserActionsMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // Don't show menu for own profile
  if (currentUserId && String(userId) === String(currentUserId)) {
    return null;
  }

  return (
    <>
      <div className={`relative ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMenu(!showMenu)}
          className="text-ink-600"
        >
          ⋮
        </Button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-full mt-2 z-50 w-48 rounded-xl border-2 border-violet-200 bg-white shadow-lg">
              <button
                onClick={() => {
                  setShowReportModal(true);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-ink-700 hover:bg-violet-50 rounded-t-xl transition-colors"
              >
                🚨 Report User
              </button>
              <button
                onClick={() => {
                  setShowBlockModal(true);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-ink-700 hover:bg-red-50 rounded-b-xl transition-colors"
              >
                {isBlocked ? "🔓 Unblock User" : "🚫 Block User"}
              </button>
            </div>
          </>
        )}
      </div>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportType="USER"
        reportedUserId={userId}
        reportedUserName={userName}
      />

      <BlockModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        targetUserId={userId}
        targetUserName={userName}
        isBlocked={isBlocked}
        onBlockChange={() => setIsBlocked(!isBlocked)}
      />
    </>
  );
}
