"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/http";
import { getAccessToken } from "@/lib/session";

type CheckInButtonProps = {
  eventId: string;
  bookingId?: string;
  isHost?: boolean;
  onCheckIn?: () => void;
};

export function CheckInButton({
  eventId,
  bookingId,
  isHost = false,
  onCheckIn
}: CheckInButtonProps) {
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCheckInStatus();
  }, [eventId]);

  const loadCheckInStatus = async () => {
    setLoading(true);
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const res = await apiFetch<{ checkedIn: boolean; qrCode?: string | null }>(`/api/events/${eventId}/checkin`, {
      headers: { authorization: `Bearer ${token}` }
    });

    if (res.ok && res.data) {
      setCheckedIn(res.data.checkedIn || false);
      setQrCode(res.data.qrCode || null);
    }
    setLoading(false);
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    const token = getAccessToken();

    const res = await apiFetch(`/api/events/${eventId}/checkin`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        bookingId,
        qrCode: qrCode || undefined
      })
    });

    setCheckingIn(false);

    if (res.ok) {
      setCheckedIn(true);
      onCheckIn?.();
    } else if (!res.ok) {
      alert(res.error || "Failed to check in");
    }
  };

  if (loading) {
    return <Button variant="outline" size="sm" disabled>Loading...</Button>;
  }

  if (checkedIn) {
    return (
      <div className="flex items-center gap-2">
        <Badge tone="success">✓ Checked In</Badge>
        {qrCode && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQR(!showQR)}
          >
            {showQR ? "Hide QR" : "Show QR"}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleCheckIn}
        disabled={checkingIn}
        size="sm"
        className="bg-green-600 hover:bg-green-700"
      >
        {checkingIn ? "Checking In..." : isHost ? "Check In Guest" : "Check In"}
      </Button>
      {showQR && qrCode && (
        <div className="p-4 bg-white rounded-xl border-2 border-violet-200">
          <p className="text-xs text-ink-600 mb-2">Your QR Code:</p>
          <div className="text-center">
            <div className="inline-block p-4 bg-white border-2 border-violet-300 rounded-lg">
              <div className="text-2xl font-mono">{qrCode}</div>
            </div>
            <p className="text-xs text-ink-600 mt-2">Show this to the host</p>
          </div>
        </div>
      )}
    </div>
  );
}
