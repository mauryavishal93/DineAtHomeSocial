"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/http";
import { getAccessToken, getRole } from "@/lib/session";

type ReferralStats = {
  totalReferrals: number;
  completedReferrals: number;
  totalRewardsEarned: number;
  pendingRewards: number;
};

type ReferralItem = {
  id: string;
  referredUserId: string;
  referralType: string;
  status: string;
  referrerReward: number;
  rewardCredited: boolean;
  createdAt: string;
};

export default function ReferralsPage() {
  const router = useRouter();
  const token = getAccessToken();
  const role = getRole();
  const [referralCode, setReferralCode] = useState("");
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [useCode, setUseCode] = useState("");
  const [usingCode, setUsingCode] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push("/auth/login");
      return;
    }
    loadReferrals();
  }, [token, router]);

  const loadReferrals = async () => {
    if (!token) return;
    
    setLoading(true);
    const res = await apiFetch<{
      referralCode: string;
      stats: ReferralStats;
      referrals: ReferralItem[];
    }>("/api/referrals", {
      headers: { authorization: `Bearer ${token}` }
    });
    
    if (res.ok && res.data) {
      setReferralCode(res.data.referralCode);
      setStats(res.data.stats);
      setReferrals(res.data.referrals);
    }
    setLoading(false);
  };

  const handleCopyCode = async () => {
    const shareUrl = `${window.location.origin}/auth/register?ref=${referralCode}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/auth/register?ref=${referralCode}`;
    const shareText = `Join DineAtHome Social using my referral code and get ₹200 off! ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join DineAtHome Social",
          text: shareText,
          url: shareUrl
        });
        return;
      } catch (err) {
        // User cancelled
      }
    }

    await navigator.clipboard.writeText(shareUrl);
    alert("Referral link copied to clipboard!");
  };

  const handleUseCode = async () => {
    if (!useCode.trim()) {
      alert("Please enter a referral code");
      return;
    }

    setUsingCode(true);
    const res = await apiFetch("/api/referrals", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        referralCode: useCode.trim(),
        referralType: role === "HOST" ? "HOST_TO_HOST" : "GUEST_TO_GUEST"
      })
    });

    setUsingCode(false);

    if (res.ok) {
      alert("Referral code applied successfully! You'll get rewards after your first booking/event.");
      setUseCode("");
      loadReferrals();
    } else if (!res.ok) {
      alert(res.error || "Failed to use referral code");
    }
  };

  const formatCurrency = (paise: number) => {
    return `₹${(paise / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <main className="py-10">
        <Container>
          <div className="text-center text-ink-700">Loading referral information...</div>
        </Container>
      </main>
    );
  }

  return (
    <main className="py-10">
      <Container>
        <div className="mb-8">
          <h1 className="font-display text-4xl tracking-tight bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
            Referral Program
          </h1>
          <p className="mt-2 text-ink-700">
            Invite friends and earn rewards! Get ₹200 for each successful referral.
          </p>
        </div>

        {/* Your Referral Code */}
        <div className="mb-8 rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-white via-pink-50/30 to-violet-50/30 p-8 shadow-colorful">
          <h2 className="font-display text-2xl text-ink-900 mb-4">Your Referral Code</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 rounded-xl border-2 border-violet-300 bg-white p-4">
              <div className="text-sm text-ink-600 mb-1">Share this link:</div>
              <div className="font-mono text-lg text-ink-900 break-all">
                {typeof window !== "undefined" ? `${window.location.origin}/auth/register?ref=${referralCode}` : referralCode}
              </div>
            </div>
            <Button onClick={handleCopyCode} variant="outline">
              {copied ? "✓ Copied!" : "📋 Copy"}
            </Button>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleShare}>🔗 Share</Button>
            <Button variant="outline" onClick={() => {
              const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/auth/register?ref=${referralCode}` : "";
              const shareText = `Join DineAtHome Social using my referral code and get ₹200 off! ${shareUrl}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
            }}>
              WhatsApp
            </Button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid gap-6 md:grid-cols-4 mb-8">
            <div className="rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-white via-pink-50/30 to-violet-50/30 p-6 shadow-lg">
              <div className="text-3xl mb-2">👥</div>
              <div className="text-2xl font-bold text-ink-900">{stats.totalReferrals}</div>
              <div className="text-sm text-ink-700">Total Referrals</div>
            </div>
            <div className="rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-white via-orange-50/30 to-yellow-50/30 p-6 shadow-lg">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-2xl font-bold text-ink-900">{stats.completedReferrals}</div>
              <div className="text-sm text-ink-700">Completed</div>
            </div>
            <div className="rounded-3xl border-2 border-green-200 bg-gradient-to-br from-white via-green-50/30 to-mint-50/30 p-6 shadow-lg">
              <div className="text-3xl mb-2">💰</div>
              <div className="text-2xl font-bold text-ink-900">{formatCurrency(stats.totalRewardsEarned)}</div>
              <div className="text-sm text-ink-700">Earned</div>
            </div>
            <div className="rounded-3xl border-2 border-sky-200 bg-gradient-to-br from-white via-sky-50/30 to-blue-50/30 p-6 shadow-lg">
              <div className="text-3xl mb-2">⏳</div>
              <div className="text-2xl font-bold text-ink-900">{formatCurrency(stats.pendingRewards)}</div>
              <div className="text-sm text-ink-700">Pending</div>
            </div>
          </div>
        )}

        {/* Use Referral Code */}
        <div className="mb-8 rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-white via-orange-50/30 to-yellow-50/30 p-8 shadow-colorful">
          <h2 className="font-display text-2xl text-ink-900 mb-4">Use a Referral Code</h2>
          <p className="text-ink-700 mb-4">
            Have a referral code? Enter it below to get ₹200 off your first booking!
          </p>
          <div className="flex gap-3">
            <Input
              label="Referral Code"
              placeholder="Enter referral code"
              value={useCode}
              onChange={(e) => setUseCode(e.target.value.toUpperCase())}
              className="flex-1"
            />
            <Button onClick={handleUseCode} disabled={usingCode || !useCode.trim()}>
              {usingCode ? "Applying..." : "Apply Code"}
            </Button>
          </div>
        </div>

        {/* Referral History */}
        {referrals.length > 0 && (
          <div className="rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-white via-pink-50/30 to-violet-50/30 p-8 shadow-colorful">
            <h2 className="font-display text-2xl text-ink-900 mb-4">Referral History</h2>
            <div className="space-y-3">
              {referrals.map((ref) => (
                <div
                  key={ref.id}
                  className="rounded-xl border-2 border-violet-200 bg-white p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-ink-900">
                      {ref.referralType.replace(/_/g, " ")}
                    </div>
                    <div className="text-sm text-ink-600">
                      {new Date(ref.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge tone={ref.status === "REWARDED" ? "success" : ref.status === "COMPLETED" ? "warning" : "ink"}>
                      {ref.status}
                    </Badge>
                    {ref.rewardCredited && (
                      <div className="text-sm text-green-600 mt-1">
                        {formatCurrency(ref.referrerReward)} earned
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
