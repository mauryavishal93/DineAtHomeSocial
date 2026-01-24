"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/http";
import { getAccessToken } from "@/lib/session";

type FavoriteItem = {
  id: string;
  favoriteType: "EVENT" | "HOST";
  eventId?: string;
  hostUserId?: string;
  event?: {
    id: string;
    title: string;
    startAt: string;
    endAt: string;
    venueName: string;
    venueAddress: string;
    hostName: string;
    priceFrom: number;
    seatsLeft: number;
  };
  host?: {
    id: string;
    name: string;
    rating: number;
    ratingCount: number;
    venueName: string;
    locality: string;
  };
  createdAt: string;
};

export default function FavoritesPage() {
  const router = useRouter();
  const token = getAccessToken();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "EVENT" | "HOST">("ALL");

  useEffect(() => {
    if (!token) {
      router.push("/auth/login");
      return;
    }

    loadFavorites();
  }, [token, router, filter]);

  const loadFavorites = async () => {
    if (!token) return;
    
    setLoading(true);
    const url = filter === "ALL" ? "/api/favorites" : `/api/favorites?type=${filter}`;
    const res = await apiFetch<{ favorites: FavoriteItem[] }>(url, {
      headers: { authorization: `Bearer ${token}` }
    });
    
    if (res.ok && res.data) {
      setFavorites(res.data.favorites);
    }
    setLoading(false);
  };

  const removeFavorite = async (id: string) => {
    if (!token) return;
    
    const res = await apiFetch("/api/favorites?id=" + id, {
      method: "DELETE",
      headers: { authorization: `Bearer ${token}` }
    });
    
    if (res.ok) {
      loadFavorites();
    }
  };

  if (loading) {
    return (
      <main className="py-10">
        <Container>
          <div className="text-center text-ink-700">Loading favorites...</div>
        </Container>
      </main>
    );
  }

  const eventFavorites = favorites.filter(f => f.favoriteType === "EVENT");
  const hostFavorites = favorites.filter(f => f.favoriteType === "HOST");

  return (
    <main className="py-10">
      <Container>
        <div className="mb-8">
          <h1 className="font-display text-4xl tracking-tight bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
            My Favorites
          </h1>
          <p className="mt-2 text-ink-700">Events and hosts you've saved</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={filter === "ALL" ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter("ALL")}
          >
            All ({favorites.length})
          </Button>
          <Button
            variant={filter === "EVENT" ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter("EVENT")}
          >
            Events ({eventFavorites.length})
          </Button>
          <Button
            variant={filter === "HOST" ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter("HOST")}
          >
            Hosts ({hostFavorites.length})
          </Button>
        </div>

        {favorites.length === 0 ? (
          <div className="rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-white via-pink-50/30 to-violet-50/30 p-12 text-center shadow-colorful">
            <div className="text-6xl mb-4">⭐</div>
            <h2 className="font-display text-2xl text-ink-900 mb-2">No favorites yet</h2>
            <p className="text-ink-700 mb-6">Start exploring events and hosts to add them to your favorites!</p>
            <Button asChild>
              <Link href="/events">Browse Events</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {eventFavorites.length > 0 && (
              <div>
                <h2 className="font-display text-2xl text-ink-900 mb-4">Favorite Events ({eventFavorites.length})</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {eventFavorites.map((fav) => (
                    <div
                      key={fav.id}
                      className="group overflow-hidden rounded-3xl border-2 border-violet-100 bg-gradient-to-br from-white via-pink-50/30 to-violet-50/30 shadow-lg backdrop-blur transition-all duration-300 hover:-translate-y-2 hover:shadow-colorful hover:border-violet-200"
                    >
                      {fav.event && (
                        <>
                          <div className="h-48 bg-gradient-to-br from-violet-100 via-pink-100 to-orange-100" />
                          <div className="p-5">
                            <div className="mb-3 flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-display text-lg text-ink-900 mb-1">{fav.event.title}</h3>
                                <p className="text-sm text-ink-600">{fav.event.venueName}</p>
                              </div>
                              <button
                                onClick={() => removeFavorite(fav.id)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                                title="Remove from favorites"
                              >
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                            <div className="mb-3 space-y-1 text-sm text-ink-700">
                              <div>📅 {new Date(fav.event.startAt).toLocaleDateString()}</div>
                              <div>💰 ₹{Math.round(fav.event.priceFrom)}</div>
                              <div>👥 {fav.event.seatsLeft} seats left</div>
                            </div>
                            <Button className="w-full" variant="outline" asChild>
                              <Link href={`/events/${fav.event.id}`}>View Details</Link>
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hostFavorites.length > 0 && (
              <div>
                <h2 className="font-display text-2xl text-ink-900 mb-4">Favorite Hosts ({hostFavorites.length})</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {hostFavorites.map((fav) => (
                    <div
                      key={fav.id}
                      className="group overflow-hidden rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-white via-orange-50/30 to-yellow-50/30 shadow-lg backdrop-blur transition-all duration-300 hover:-translate-y-2 hover:shadow-colorful hover:border-orange-300"
                    >
                      {fav.host && (
                        <>
                          <div className="h-32 bg-gradient-to-br from-orange-100 via-yellow-100 to-pink-100" />
                          <div className="p-5">
                            <div className="mb-3 flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-display text-lg text-ink-900 mb-1">{fav.host.name}</h3>
                                <p className="text-sm text-ink-600">{fav.host.venueName}</p>
                                <div className="mt-2 flex items-center gap-2">
                                  <Badge tone="success">⭐ {fav.host.rating.toFixed(1)}</Badge>
                                  <span className="text-xs text-ink-600">({fav.host.ratingCount} reviews)</span>
                                </div>
                              </div>
                              <button
                                onClick={() => removeFavorite(fav.id)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                                title="Remove from favorites"
                              >
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                            <Button className="w-full" variant="outline" asChild>
                              <Link href={`/hosts/${fav.hostUserId}`}>View Profile</Link>
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Container>
    </main>
  );
}
