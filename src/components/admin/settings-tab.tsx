"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/http";
import { getAccessToken } from "@/lib/session";

export function SettingsTab() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const res = await apiFetch<any>(`/api/admin/settings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setSettings(res.data);
    }
    setLoading(false);
  }

  async function saveSettings() {
    setSaving(true);
    const token = getAccessToken();
    if (!token) return;

    const res = await apiFetch(`/api/admin/settings`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(settings)
    });
    if (res.ok) {
      alert("Settings saved successfully!");
    } else if (!res.ok) {
      alert(`Failed to save settings: ${res.error}`);
    }
    setSaving(false);
  }

  function formatCurrency(paise: number): string {
    return `₹${(paise / 100).toFixed(2)}`;
  }

  if (loading) {
    return <div className="text-center py-12 text-ink-600">Loading settings...</div>;
  }

  if (!settings) {
    return <div className="text-center py-12 text-ink-600">Failed to load settings</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="rounded-lg border border-sand-200 p-6 space-y-4">
        <h3 className="font-display text-lg text-ink-900">Platform Settings</h3>

        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">
            Host Registration Fee (in paise)
          </label>
          <input
            type="number"
            value={settings.hostRegistrationFee}
            onChange={(e) =>
              setSettings({ ...settings, hostRegistrationFee: Number.parseInt(e.target.value, 10) })
            }
            className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm"
          />
          <div className="text-xs text-ink-600 mt-1">
            Current: {formatCurrency(settings.hostRegistrationFee)}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">
            Platform Commission Rate (0-1)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={settings.platformCommissionRate}
            onChange={(e) =>
              setSettings({ ...settings, platformCommissionRate: Number.parseFloat(e.target.value) })
            }
            className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm"
          />
          <div className="text-xs text-ink-600 mt-1">
            Current: {(settings.platformCommissionRate * 100).toFixed(1)}%
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">
            Max Guests Per Event
          </label>
          <input
            type="number"
            value={settings.maxGuestsPerEvent}
            onChange={(e) =>
              setSettings({ ...settings, maxGuestsPerEvent: Number.parseInt(e.target.value, 10) })
            }
            className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">Refund Policy</label>
          <textarea
            value={settings.refundPolicy}
            onChange={(e) => setSettings({ ...settings, refundPolicy: e.target.value })}
            className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">Cancellation Policy</label>
          <textarea
            value={settings.cancellationPolicy}
            onChange={(e) => setSettings({ ...settings, cancellationPolicy: e.target.value })}
            className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm"
            rows={3}
          />
        </div>

        <Button onClick={saveSettings} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
