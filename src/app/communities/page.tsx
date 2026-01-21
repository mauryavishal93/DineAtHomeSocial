"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { apiFetch } from "@/lib/http";
import { getAccessToken } from "@/lib/session";
import Link from "next/link";

type Community = {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  creatorName: string;
  memberCount: number;
  isPrivate: boolean;
  imageUrl: string;
  createdAt: string;
};

export default function CommunitiesPage() {
  const token = getAccessToken();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    name: "",
    description: "",
    category: "CUISINE",
    tags: ""
  });

  useEffect(() => {
    loadCommunities();
  }, [categoryFilter, searchQuery]);

  const loadCommunities = async () => {
    setLoading(true);
    let url = "/api/communities";
    const params = new URLSearchParams();
    if (categoryFilter !== "ALL") {
      params.append("category", categoryFilter);
    }
    if (searchQuery) {
      params.append("search", searchQuery);
    }
    if (params.toString()) {
      url += "?" + params.toString();
    }

    const res = await apiFetch<{ communities: Community[] }>(url);
    if (res.ok && res.data) {
      setCommunities(res.data.communities);
    }
    setLoading(false);
  };

  const handleJoin = async (communityId: string) => {
    if (!token) {
      alert("Please login to join communities");
      return;
    }

    const res = await apiFetch(`/api/communities/${communityId}/join`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      loadCommunities();
    } else {
      alert(res.error || "Failed to join community");
    }
  };

  const handleCreate = async () => {
    if (!token) {
      alert("Please login to create a community");
      return;
    }

    if (!newCommunity.name.trim()) {
      alert("Community name is required");
      return;
    }

    const res = await apiFetch("/api/communities", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...newCommunity,
        tags: newCommunity.tags.split(",").map(t => t.trim()).filter(Boolean)
      })
    });

    if (res.ok) {
      setIsCreating(false);
      setNewCommunity({ name: "", description: "", category: "CUISINE", tags: "" });
      loadCommunities();
    } else {
      alert(res.error || "Failed to create community");
    }
  };

  const categories = ["ALL", "CUISINE", "LIFESTYLE", "DIETARY", "ACTIVITY", "DEMOGRAPHIC", "OTHER"];

  return (
    <main className="py-10">
      <Container>
        <div className="mb-8">
          <h1 className="font-display text-4xl tracking-tight bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
            Dining Communities
          </h1>
          <p className="mt-2 text-ink-700">
            Join communities of like-minded food lovers and get exclusive access to special events
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? "primary" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="mb-6">
          <Input
            label="Search communities"
            placeholder="Search by name, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center text-ink-700 py-12">Loading communities...</div>
        ) : communities.length === 0 ? (
          <div className="rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-white via-pink-50/30 to-violet-50/30 p-12 text-center shadow-colorful">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="font-display text-2xl text-ink-900 mb-2">No communities found</h2>
            <p className="text-ink-700 mb-6">Be the first to create a community!</p>
            <Button onClick={() => setIsCreating(true)}>Create Community</Button>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {communities.map((community) => (
                <div
                  key={community.id}
                  className="overflow-hidden rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-white via-pink-50/30 to-violet-50/30 shadow-lg backdrop-blur transition-all duration-300 hover:shadow-colorful hover:border-violet-300 hover:-translate-y-1"
                >
                  {community.imageUrl ? (
                    <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${community.imageUrl})` }} />
                  ) : (
                    <div className="h-32 bg-gradient-to-br from-violet-100 via-pink-100 to-orange-100" />
                  )}
                  <div className="p-6">
                    <div className="mb-3">
                      <h3 className="font-display text-xl text-ink-900 mb-2">{community.name}</h3>
                      <Badge tone="violet">{community.category}</Badge>
                    </div>

                    <p className="mb-4 text-sm text-ink-700">{community.description}</p>

                    <div className="mb-4 flex flex-wrap gap-2">
                      {community.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} tone="pink">{tag}</Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-ink-700">
                        <span className="font-semibold text-ink-900">{community.memberCount}</span> members
                      </div>
                      <Button size="sm" onClick={() => handleJoin(community.id)}>
                        Join Community
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-white via-orange-50/30 to-yellow-50/30 p-8 shadow-colorful">
              <h2 className="font-display text-2xl text-ink-900 mb-2">Create Your Own Community</h2>
              <p className="text-ink-700 mb-6">
                Have a unique interest or dining preference? Start your own community and host exclusive events
              </p>
              {!isCreating ? (
                <Button onClick={() => setIsCreating(true)}>Create Community</Button>
              ) : (
                <div className="space-y-4">
                  <Input
                    label="Community Name"
                    placeholder="e.g., Vegan Foodies Delhi"
                    value={newCommunity.name}
                    onChange={(e) => setNewCommunity({ ...newCommunity, name: e.target.value })}
                  />
                  <Input
                    label="Description"
                    placeholder="Describe your community..."
                    value={newCommunity.description}
                    onChange={(e) => setNewCommunity({ ...newCommunity, description: e.target.value })}
                  />
                  <div>
                    <label className="text-sm font-semibold text-ink-800 mb-1 block">Category</label>
                    <select
                      className="w-full rounded-xl border-2 border-violet-200 px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400"
                      value={newCommunity.category}
                      onChange={(e) => setNewCommunity({ ...newCommunity, category: e.target.value })}
                    >
                      <option value="CUISINE">Cuisine</option>
                      <option value="LIFESTYLE">Lifestyle</option>
                      <option value="DIETARY">Dietary</option>
                      <option value="ACTIVITY">Activity</option>
                      <option value="DEMOGRAPHIC">Demographic</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <Input
                    label="Tags (comma-separated)"
                    placeholder="vegan, delhi, healthy"
                    value={newCommunity.tags}
                    onChange={(e) => setNewCommunity({ ...newCommunity, tags: e.target.value })}
                  />
                  <div className="flex gap-3">
                    <Button onClick={handleCreate}>Create</Button>
                    <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </Container>
    </main>
  );
}
