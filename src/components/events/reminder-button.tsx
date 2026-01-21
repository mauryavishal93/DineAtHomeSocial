"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/http";
import { getAccessToken } from "@/lib/session";

type ReminderButtonProps = {
  eventId: string;
  isHost?: boolean;
};

export function ReminderButton({ eventId, isHost = false }: ReminderButtonProps) {
  const [reminderStatus, setReminderStatus] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isHost) {
      loadReminderStatus();
    }
  }, [eventId, isHost]);

  const loadReminderStatus = async () => {
    setLoading(true);
    const token = getAccessToken();
    const res = await apiFetch(`/api/events/${eventId}/reminders`, {
      headers: { authorization: `Bearer ${token}` }
    });

    if (res.ok && res.data) {
      setReminderStatus(res.data);
    }
    setLoading(false);
  };

  const sendReminder = async (type: "24_HOURS" | "2_HOURS") => {
    setSending(true);
    const token = getAccessToken();

    const res = await apiFetch<{ success: boolean; message: string; sentCount: number }>(`/api/events/${eventId}/reminders`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ reminderType: type })
    });

    setSending(false);

    if (res.ok && res.data) {
      alert(`Reminders sent to ${res.data.sentCount} guests!`);
      loadReminderStatus();
    } else if (!res.ok) {
      alert(res.error || "Failed to send reminders");
    }
  };

  if (!isHost || loading) {
    return null;
  }

  if (!reminderStatus) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {reminderStatus.canSend24HourReminder && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => sendReminder("24_HOURS")}
          disabled={sending}
        >
          {sending ? "Sending..." : "📧 Send 24hr Reminder"}
        </Button>
      )}
      {reminderStatus.canSend2HourReminder && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => sendReminder("2_HOURS")}
          disabled={sending}
        >
          {sending ? "Sending..." : "⏰ Send 2hr Reminder"}
        </Button>
      )}
    </div>
  );
}
