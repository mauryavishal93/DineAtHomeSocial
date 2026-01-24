"use client";

import { Badge } from "@/components/ui/badge";

interface VerificationBadgeProps {
  isIdentityVerified: boolean;
  governmentIdPath?: string;
}

/**
 * Determines and displays the host verification status creatively
 * - "✓ Verified Host" if host is verified by admin
 * - "⏳ Host ID Verification in Process" if ID uploaded but pending admin review
 * - "⚠️ Host ID Not Verified" if no ID uploaded
 */
export function VerificationBadge({ isIdentityVerified, governmentIdPath }: VerificationBadgeProps) {
  const hasUploadedId = governmentIdPath && governmentIdPath.trim() !== "";

  if (isIdentityVerified) {
    return (
      <Badge 
        tone="success" 
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 text-green-800 font-semibold shadow-sm"
        title="This host has been verified by our admin team after reviewing their government ID"
      >
        <span className="text-lg">✓</span>
        <span>Verified Host</span>
      </Badge>
    );
  }

  if (hasUploadedId) {
    return (
      <Badge 
        tone="warning" 
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 text-amber-800 font-semibold shadow-sm"
        title="Host has uploaded their ID document. Verification is in progress by our admin team"
      >
        <span className="text-lg animate-pulse">⏳</span>
        <span>Host ID Verification in Process</span>
      </Badge>
    );
  }

  return (
    <Badge 
      tone="ink" 
      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-300 text-gray-700 font-semibold shadow-sm"
      title="This host has not yet uploaded their government ID for verification"
    >
      <span className="text-lg">⚠️</span>
      <span>Host ID Not Verified</span>
    </Badge>
  );
}
