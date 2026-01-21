"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/http";
import { getAccessToken } from "@/lib/session";

type Conversation = {
  eventSlotId: string;
  eventName: string;
  eventDate: string;
  venueName: string;
  venueAddress: string;
  otherPartyName: string;
  otherPartyId: string;
  otherPartyRole: "HOST" | "GUEST";
  latestMessage: {
    message: string;
    senderName: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  isHost: boolean;
  isEventEnded?: boolean;
};

export default function MessagesPage() {
  const router = useRouter();
  const token = getAccessToken();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push("/auth/login");
      return;
    }

    loadConversations();
    
    // Poll for new messages every 10 seconds
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, [token, router]);

  const loadConversations = async () => {
    if (!token) return;
    
    const res = await apiFetch<{ conversations: Conversation[] }>("/api/chat/conversations", {
      headers: { authorization: `Bearer ${token}` }
    });
    
    if (res.ok && res.data) {
      setConversations(res.data.conversations);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <main className="py-10">
        <Container>
          <div className="text-center text-ink-700">Loading conversations...</div>
        </Container>
      </main>
    );
  }

  return (
    <main className="py-10">
      <Container>
        <div className="mb-8">
          <h1 className="font-display text-4xl tracking-tight bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
            Messages
          </h1>
          <p className="mt-2 text-ink-700">Chat with hosts and guests about your events</p>
        </div>

        {conversations.length === 0 ? (
          <div className="rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-white via-pink-50/30 to-violet-50/30 p-12 text-center shadow-colorful">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="font-display text-2xl text-ink-900 mb-2">No conversations yet</h2>
            <p className="text-ink-700 mb-6">Start chatting by booking an event or hosting one!</p>
            <div className="flex gap-3 justify-center">
              <Button asChild>
                <Link href="/events">Browse Events</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/host">Become a Host</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conv) => (
              <Link
                key={conv.eventSlotId}
                href={`/messages/${conv.eventSlotId}`}
                className="block group"
              >
                <div className="rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-white via-pink-50/30 to-violet-50/30 p-6 shadow-lg transition-all duration-300 hover:shadow-colorful hover:border-violet-300 hover:-translate-y-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-display text-xl text-ink-900">{conv.eventName}</h3>
                        <Badge tone={conv.isHost ? "violet" : "orange"}>
                          {conv.isHost ? "Host" : "Guest"}
                        </Badge>
                        {conv.isEventEnded && (
                          <Badge tone="ink">⏰ Closed</Badge>
                        )}
                        {conv.unreadCount > 0 && (
                          <Badge tone="pink">{conv.unreadCount} new</Badge>
                        )}
                      </div>
                      <p className="text-sm text-ink-600 mb-2">
                        {conv.otherPartyRole === "HOST" ? "Host" : "Guest"}: {conv.otherPartyName}
                      </p>
                      <p className="text-sm text-ink-700 mb-1">
                        📍 {conv.venueName}
                      </p>
                      {conv.latestMessage && (
                        <div className="mt-3 pt-3 border-t border-violet-200">
                          <p className="text-sm text-ink-600 truncate">
                            <span className="font-medium">{conv.latestMessage.senderName}:</span>{" "}
                            {conv.latestMessage.message}
                          </p>
                          <p className="text-xs text-ink-500 mt-1">
                            {new Date(conv.latestMessage.createdAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-xs text-ink-600 mb-2">
                        {new Date(conv.eventDate).toLocaleDateString()}
                      </div>
                      <Button variant="ghost" size="sm">
                        View Chat →
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
