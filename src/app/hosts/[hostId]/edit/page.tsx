"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/http";
import { getAccessToken, getRole } from "@/lib/session";

// Dynamically import AddressMap to avoid SSR issues with Leaflet
const AddressMap = dynamic(() => import("@/components/map/address-map").then((mod) => mod.AddressMap), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 rounded-lg border border-sand-200 bg-sand-100 flex items-center justify-center text-sm text-ink-600">
      Loading map...
    </div>
  )
});

export default function EditHostProfilePage() {
  const params = useParams();
  const router = useRouter();
  const hostId = params?.hostId as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: 0,
    bio: "",
    venueName: "",
    venueAddress: "",
    locality: "",
    description: "",
    cuisines: [] as string[],
    activities: [] as string[],
    latitude: "",
    longitude: ""
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (hostId && mounted) {
      checkOwnershipAndLoad();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostId, mounted]);

  async function checkOwnershipAndLoad() {
    const token = getAccessToken();
    const role = getRole();
    
    if (!token || role !== "HOST") {
      router.push(`/hosts/${hostId}`);
      return;
    }

    try {
      const res = await apiFetch<{ userId: string; role: string }>("/api/me", {
        headers: { authorization: `Bearer ${token}` }
      });
      if (res.ok && res.data.userId) {
        if (res.data.userId !== hostId || res.data.role !== "HOST") {
          router.push(`/hosts/${hostId}`);
          return;
        }
        loadHostProfile();
      } else {
        router.push(`/hosts/${hostId}`);
      }
    } catch (error) {
      router.push(`/hosts/${hostId}`);
    }
  }

  async function loadHostProfile() {
    setLoading(true);
    
    // Load profile data (includes age)
    const token = getAccessToken();
    let age = 0;
    if (token) {
      const profileRes = await apiFetch<any>(`/api/host/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (profileRes.ok) {
        age = profileRes.data.age || 0;
      }
    }

    const res = await apiFetch<any>(`/api/hosts/${hostId}`);
    if (res.ok) {
      const { host, venue } = res.data;
      setFormData({
        firstName: host.firstName || "",
        lastName: host.lastName || "",
        age: age,
        bio: host.bio || "",
        venueName: venue?.name || "",
        venueAddress: venue?.address || "",
        locality: venue?.locality || "",
        description: venue?.description || "",
        cuisines: venue?.foodCategories || [],
        activities: venue?.gamesAvailable || [],
        latitude: venue?.latitude?.toString() || "",
        longitude: venue?.longitude?.toString() || ""
      });
    } else {
      setError("Failed to load profile");
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const token = getAccessToken();
    if (!token) {
      setError("Please log in");
      setSaving(false);
      return;
    }

    // Update host profile
    const profileRes = await apiFetch(`/api/host/profile`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        firstName: formData.firstName,
        lastName: formData.lastName,
        age: formData.age || 0,
        bio: formData.bio,
        venueName: formData.venueName,
        venueAddress: formData.venueAddress,
        locality: formData.locality,
        description: formData.description,
        cuisines: formData.cuisines,
        activities: formData.activities,
        latitude: formData.latitude ? Number.parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? Number.parseFloat(formData.longitude) : null
      })
    });

    if (!profileRes.ok) {
      setError(profileRes.error || "Failed to update profile");
      setSaving(false);
      return;
    }

    // Update bio separately (if there's an endpoint for it)
    // For now, we'll update it through the profile endpoint if it supports bio
    // Otherwise, we might need to create a separate endpoint

    alert("Profile updated successfully!");
    router.push(`/hosts/${hostId}`);
  }

  function addCuisine() {
    const cuisine = prompt("Enter cuisine type:");
    if (cuisine && !formData.cuisines.includes(cuisine)) {
      setFormData({ ...formData, cuisines: [...formData.cuisines, cuisine] });
    }
  }

  function removeCuisine(index: number) {
    setFormData({
      ...formData,
      cuisines: formData.cuisines.filter((_, i) => i !== index)
    });
  }

  function addActivity() {
    const activity = prompt("Enter activity:");
    if (activity && !formData.activities.includes(activity)) {
      setFormData({ ...formData, activities: [...formData.activities, activity] });
    }
  }

  function removeActivity(index: number) {
    setFormData({
      ...formData,
      activities: formData.activities.filter((_, i) => i !== index)
    });
  }

  if (loading) {
    return (
      <main className="py-10">
        <Container>
          <div className="text-center py-12 text-ink-600">Loading...</div>
        </Container>
      </main>
    );
  }

  return (
    <main className="py-10">
      <Container>
        <div className="mb-6">
          <Link href={`/hosts/${hostId}`} className="text-sm text-ink-600 hover:text-ink-900">
            ← Back to Profile
          </Link>
        </div>

        <h1 className="font-display text-4xl tracking-tight text-ink-900 mb-8">Edit Profile</h1>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-red-600 text-sm">{error}</div>
          )}

          {/* Host Name */}
          <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
            <h2 className="font-display text-xl text-ink-900 mb-4">Host Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-ink-700 mb-1">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm"
                rows={4}
                placeholder="Tell guests about yourself..."
              />
            </div>
          </div>

          {/* Venue Information */}
          <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
            <h2 className="font-display text-xl text-ink-900 mb-4">Venue Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Venue Name</label>
                <input
                  type="text"
                  value={formData.venueName}
                  onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                  className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.venueAddress}
                  onChange={(e) => setFormData({ ...formData, venueAddress: e.target.value })}
                  className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Locality</label>
                <input
                  type="text"
                  value={formData.locality}
                  onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                  className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Cuisines */}
          <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-ink-900">Cuisine Types</h2>
              <Button type="button" size="sm" variant="outline" onClick={addCuisine}>
                + Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.cuisines.map((cuisine, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-sand-100 px-3 py-1 rounded-full text-sm"
                >
                  <span>{cuisine}</span>
                  <button
                    type="button"
                    onClick={() => removeCuisine(idx)}
                    className="text-ink-600 hover:text-ink-900"
                  >
                    ×
                  </button>
                </div>
              ))}
              {formData.cuisines.length === 0 && (
                <div className="text-sm text-ink-600">No cuisines added yet</div>
              )}
            </div>
          </div>

          {/* Activities */}
          <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-ink-900">Activities</h2>
              <Button type="button" size="sm" variant="outline" onClick={addActivity}>
                + Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.activities.map((activity, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-sand-100 px-3 py-1 rounded-full text-sm"
                >
                  <span>{activity}</span>
                  <button
                    type="button"
                    onClick={() => removeActivity(idx)}
                    className="text-ink-600 hover:text-ink-900"
                  >
                    ×
                  </button>
                </div>
              ))}
              {formData.activities.length === 0 && (
                <div className="text-sm text-ink-600">No activities added yet</div>
              )}
            </div>
          </div>

          {/* Map Location */}
          <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-soft backdrop-blur">
            <h2 className="font-display text-xl text-ink-900 mb-4">Map Location</h2>
            {formData.venueAddress ? (
              <div className="mb-4">
                <AddressMap
                  address={formData.venueAddress}
                  latitude={formData.latitude ? parseFloat(formData.latitude) : null}
                  longitude={formData.longitude ? parseFloat(formData.longitude) : null}
                  editable={true}
                  onLocationSelect={(address, lat, lng) => {
                    setFormData({
                      ...formData,
                      latitude: lat.toString(),
                      longitude: lng.toString(),
                      venueAddress: address || formData.venueAddress
                    });
                  }}
                />
              </div>
            ) : (
              <p className="text-sm text-ink-600 mb-4">Please enter a venue address above to see the map.</p>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm"
                  placeholder="e.g., 28.6139"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm"
                  placeholder="e.g., 77.2090"
                />
              </div>
            </div>
            <p className="text-xs text-ink-600 mt-2">
              Enter your address above and click "Get Location" on the map, or click directly on the map to select a location.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Link href={`/hosts/${hostId}`}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Container>
    </main>
  );
}
