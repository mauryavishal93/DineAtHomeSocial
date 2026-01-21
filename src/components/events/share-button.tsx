"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/http";

export function ShareButton({ eventId }: { eventId: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      const res = await apiFetch<{ shareUrl: string; shareText: string }>(
        `/api/events/${eventId}/share`
      );

      if (res.ok && res.data) {
        // Try Web Share API first
        if (navigator.share) {
          try {
            await navigator.share({
              title: res.data.shareText,
              text: res.data.shareText,
              url: res.data.shareUrl
            });
            return;
          } catch (err) {
            // User cancelled or error, fall through to copy
          }
        }

        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(res.data.shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleShare}>
      {copied ? "✓ Copied!" : "🔗 Share"}
    </Button>
  );
}
