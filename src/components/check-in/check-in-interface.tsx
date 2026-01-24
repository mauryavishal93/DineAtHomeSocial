"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/http";
import { getAccessToken } from "@/lib/session";

type CheckInInterfaceProps = {
  eventId: string;
};

export function CheckInInterface({ eventId }: CheckInInterfaceProps) {
  const [eventCode, setEventCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    guestName?: string;
  } | null>(null);

  const handleVerify = async () => {
    if (!eventCode.trim()) {
      setResult({ success: false, message: "Please enter an event code" });
      return;
    }

    setVerifying(true);
    setResult(null);

    const token = getAccessToken();
    if (!token) {
      setResult({ success: false, message: "Please log in to check in guests" });
      setVerifying(false);
      return;
    }

    const res = await apiFetch<{
      success: boolean;
      valid: boolean;
      guestName?: string;
      message?: string;
      error?: string;
    }>("/api/passes/verify", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        eventCode: eventCode.trim().toUpperCase(),
        eventId
      })
    });

    setVerifying(false);

    if (res.ok && res.data) {
      if (res.data.success) {
        setResult({
          success: true,
          message: res.data.message || "Guest checked in successfully!",
          guestName: res.data.guestName
        });
        setEventCode(""); // Clear input on success
        
        // Clear result after 5 seconds
        setTimeout(() => {
          setResult(null);
        }, 5000);
      } else {
        // API returned success: false
        setResult({
          success: false,
          message: res.data.error || res.data.message || "Failed to verify event code"
        });
      }
    } else if (!res.ok) {
      // API request failed
      setResult({
        success: false,
        message: res.error || "Failed to verify event code"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleVerify();
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white/80 rounded-xl p-4 border border-violet-200">
        <div className="flex gap-2">
          <Input
            label="Enter Event Code"
            type="text"
            value={eventCode}
            onChange={(e) => {
              setEventCode(e.target.value.toUpperCase());
              setResult(null); // Clear previous result when typing
            }}
            onKeyPress={handleKeyPress}
            placeholder="EVT-XXXXXX-YYYYYY"
            className="flex-1 font-mono text-lg tracking-wider uppercase"
            disabled={verifying}
          />
          <Button
            onClick={handleVerify}
            disabled={verifying || !eventCode.trim()}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
          >
            {verifying ? "Verifying..." : "Verify"}
          </Button>
        </div>
        <p className="text-xs text-ink-600 mt-2">
          Ask guests to show their event code from their pass
        </p>
      </div>

      {result && (
        <div
          className={`rounded-xl p-4 border-2 ${
            result.success
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {result.success ? (
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1">
              <p
                className={`font-medium ${
                  result.success ? "text-green-900" : "text-red-900"
                }`}
              >
                {result.message}
              </p>
              {result.success && result.guestName && (
                <p className="text-sm text-green-700 mt-1">
                  Guest: <strong>{result.guestName}</strong>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
