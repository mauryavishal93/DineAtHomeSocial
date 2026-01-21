"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/http";
import { getAccessToken, getRole } from "@/lib/session";

type Template = {
  id: string;
  templateName: string;
  description: string;
  eventName: string;
  theme: string;
  durationHours: number;
  maxGuests: number;
  cuisines: string[];
  foodTags: string[];
  gamesAvailable: string[];
  basePricePerGuest: number;
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
};

export default function TemplatesPage() {
  const router = useRouter();
  const token = getAccessToken();
  const role = getRole();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    templateName: "",
    description: "",
    eventName: "",
    theme: "",
    durationHours: 2,
    maxGuests: 10,
    cuisines: "",
    foodTags: "",
    gamesAvailable: "",
    basePricePerGuest: 0
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push("/auth/login");
      return;
    }
    if (role !== "HOST") {
      router.push("/");
      return;
    }
    loadTemplates();
  }, [token, role, router]);

  const loadTemplates = async () => {
    if (!token) return;
    
    setLoading(true);
    const res = await apiFetch<{ templates: Template[] }>("/api/host/templates", {
      headers: { authorization: `Bearer ${token}` }
    });
    
    if (res.ok && res.data) {
      setTemplates(res.data.templates);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newTemplate.templateName || !newTemplate.eventName) {
      alert("Template name and event name are required");
      return;
    }

    setCreating(true);
    const res = await apiFetch("/api/host/templates", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...newTemplate,
        cuisines: newTemplate.cuisines.split(",").map(c => c.trim()).filter(Boolean),
        foodTags: newTemplate.foodTags.split(",").map(t => t.trim()).filter(Boolean),
        gamesAvailable: newTemplate.gamesAvailable.split(",").map(g => g.trim()).filter(Boolean),
        basePricePerGuest: newTemplate.basePricePerGuest * 100 // Convert to paise
      })
    });

    setCreating(false);

    if (res.ok) {
      setShowCreateModal(false);
      setNewTemplate({
        templateName: "",
        description: "",
        eventName: "",
        theme: "",
        durationHours: 2,
        maxGuests: 10,
        cuisines: "",
        foodTags: "",
        gamesAvailable: "",
        basePricePerGuest: 0
      });
      loadTemplates();
    } else {
      alert(res.error || "Failed to create template");
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    const res = await apiFetch(`/api/host/templates?id=${templateId}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      loadTemplates();
    } else {
      alert(res.error || "Failed to delete template");
    }
  };

  const formatCurrency = (paise: number) => {
    return `₹${(paise / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <main className="py-10">
        <Container>
          <div className="text-center text-ink-700">Loading templates...</div>
        </Container>
      </main>
    );
  }

  return (
    <main className="py-10">
      <Container>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl tracking-tight bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
              Event Templates
            </h1>
            <p className="mt-2 text-ink-700">Save event configurations for quick reuse</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>+ Create Template</Button>
        </div>

        {templates.length === 0 ? (
          <div className="rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-white via-pink-50/30 to-violet-50/30 p-12 text-center shadow-colorful">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="font-display text-2xl text-ink-900 mb-2">No templates yet</h2>
            <p className="text-ink-700 mb-6">Create templates to quickly set up recurring events</p>
            <Button onClick={() => setShowCreateModal(true)}>Create Your First Template</Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-white via-pink-50/30 to-violet-50/30 p-6 shadow-lg hover:shadow-colorful transition-shadow"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-display text-lg text-ink-900 mb-1">{template.templateName}</h3>
                    <p className="text-sm text-ink-600">{template.eventName}</p>
                  </div>
                  <Badge tone="violet">{template.usageCount}x used</Badge>
                </div>

                <div className="space-y-2 text-sm text-ink-700 mb-4">
                  <div>⏱️ {template.durationHours} hours</div>
                  <div>👥 {template.maxGuests} guests</div>
                  <div>💰 {formatCurrency(template.basePricePerGuest)} per guest</div>
                  {template.cuisines.length > 0 && (
                    <div>🍽️ {template.cuisines.slice(0, 2).join(", ")}</div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <Link href={`/host/events/new?template=${template.id}`}>
                      Use Template
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Template Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-3xl border-2 border-violet-200 bg-white p-8 shadow-glow max-h-[90vh] overflow-y-auto">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-2xl text-ink-900">Create Template</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-ink-600 hover:text-ink-900 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <Input
                  label="Template Name *"
                  placeholder="e.g., Weekend Brunch"
                  value={newTemplate.templateName}
                  onChange={(e) => setNewTemplate({ ...newTemplate, templateName: e.target.value })}
                />
                <Input
                  label="Event Name *"
                  placeholder="e.g., Sunday Brunch Experience"
                  value={newTemplate.eventName}
                  onChange={(e) => setNewTemplate({ ...newTemplate, eventName: e.target.value })}
                />
                <Input
                  label="Description"
                  placeholder="Template description..."
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-ink-800 mb-1 block">Duration (hours) *</label>
                    <input
                      type="number"
                      className="w-full rounded-xl border-2 border-violet-200 px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400"
                      value={newTemplate.durationHours}
                      onChange={(e) => setNewTemplate({ ...newTemplate, durationHours: parseInt(e.target.value) || 2 })}
                      min="1"
                      max="24"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-ink-800 mb-1 block">Max Guests *</label>
                    <input
                      type="number"
                      className="w-full rounded-xl border-2 border-violet-200 px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400"
                      value={newTemplate.maxGuests}
                      onChange={(e) => setNewTemplate({ ...newTemplate, maxGuests: parseInt(e.target.value) || 10 })}
                      min="1"
                      max="200"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-ink-800 mb-1 block">Base Price per Guest (₹) *</label>
                  <input
                    type="number"
                    className="w-full rounded-xl border-2 border-violet-200 px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400"
                    value={newTemplate.basePricePerGuest}
                    onChange={(e) => setNewTemplate({ ...newTemplate, basePricePerGuest: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                  />
                </div>
                <Input
                  label="Cuisines (comma-separated)"
                  placeholder="Italian, Indian, Chinese"
                  value={newTemplate.cuisines}
                  onChange={(e) => setNewTemplate({ ...newTemplate, cuisines: e.target.value })}
                />
                <Input
                  label="Food Tags (comma-separated)"
                  placeholder="vegetarian, vegan, gluten-free"
                  value={newTemplate.foodTags}
                  onChange={(e) => setNewTemplate({ ...newTemplate, foodTags: e.target.value })}
                />
                <Input
                  label="Activities (comma-separated)"
                  placeholder="board games, music, cooking class"
                  value={newTemplate.gamesAvailable}
                  onChange={(e) => setNewTemplate({ ...newTemplate, gamesAvailable: e.target.value })}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <Button onClick={handleCreate} disabled={creating || !newTemplate.templateName || !newTemplate.eventName}>
                  {creating ? "Creating..." : "Create Template"}
                </Button>
                <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={creating}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
