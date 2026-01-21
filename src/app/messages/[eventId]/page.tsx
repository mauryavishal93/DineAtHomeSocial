"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/http";
import { getAccessToken, getRole } from "@/lib/session";

type Message = {
  id: string;
  eventSlotId: string;
  senderUserId: string;
  senderName: string;
  senderRole: "HOST" | "GUEST";
  message: string;
  messageType: string;
  imageUrl: string;
  createdAt: string;
  isRead: boolean;
};

export default function ChatPage({
  params
}: {
  params: Promise<{ eventId: string }>;
}) {
  const router = useRouter();
  const token = getAccessToken();
  const role = getRole();
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string>("Event Chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isEventEnded, setIsEventEnded] = useState(false);
  const [chatClosedReason, setChatClosedReason] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    params.then((p) => setEventId(p.eventId));
  }, [params]);

  // Get current user ID
  useEffect(() => {
    if (!token) return;
    
    (async () => {
      const res = await apiFetch<{ userId: string }>("/api/me", {
        headers: { authorization: `Bearer ${token}` }
      });
      if (res.ok && res.data) {
        setCurrentUserId(res.data.userId);
      }
    })();
  }, [token]);

  // Load messages and poll for updates
  useEffect(() => {
    if (!token || !eventId) {
      if (!token) router.push("/auth/login");
      return;
    }

    loadMessages();
    
    // Poll for new messages every 3 seconds
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [token, eventId, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    if (!token || !eventId) return;
    
    const res = await apiFetch<{ messages: Message[]; isEventEnded?: boolean; eventName?: string }>(
      `/api/chat?eventSlotId=${eventId}`,
      {
        headers: { authorization: `Bearer ${token}` }
      }
    );
    
    if (res.ok && res.data) {
      setMessages(res.data.messages || []);
      setIsEventEnded(res.data.isEventEnded || false);
      setChatClosedReason(null);
      if (res.data.eventName) {
        setEventName(res.data.eventName);
      }
      setLoading(false);
    } else if (!res.ok && res.error?.includes("cancelled")) {
      setChatClosedReason("Your booking for this event has been cancelled.");
      setIsEventEnded(true);
      setLoading(false);
    } else {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !eventId || !newMessage.trim() || sending || isEventEnded) return;

    setSending(true);
    const res = await apiFetch<{ message: Message }>("/api/chat", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        eventSlotId: eventId,
        message: newMessage.trim()
      })
    });

    if (res.ok && res.data) {
      setMessages([...messages, res.data.message]);
      setNewMessage("");
    } else if (!res.ok && res.error?.includes("Chat is closed")) {
      setIsEventEnded(true);
    }
    setSending(false);
  };

  if (loading) {
    return (
      <main className="py-10">
        <Container>
          <div className="text-center text-ink-700">Loading chat...</div>
        </Container>
      </main>
    );
  }

  return (
    <main className="py-10">
      <Container>
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/messages">← Back</Link>
          </Button>
          <h1 className="font-display text-2xl tracking-tight bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
            {eventName}
          </h1>
        </div>

        <div className="rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-white via-pink-50/30 to-violet-50/30 shadow-colorful overflow-hidden">
          {/* Messages Area */}
          <div className="h-[600px] overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-ink-600 py-12">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                // Properly check if this is the current user's message
                const isOwnMessage = currentUserId ? String(msg.senderUserId) === String(currentUserId) : false;
                const isHost = msg.senderRole === "HOST";
                
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl p-4 ${
                        isOwnMessage
                          ? isHost
                            ? "bg-gradient-to-br from-violet-200 to-pink-200 border-2 border-violet-300"
                            : "bg-gradient-to-br from-orange-200 to-yellow-200 border-2 border-orange-300"
                          : isHost
                            ? "bg-gradient-to-br from-violet-100 to-pink-100 border-2 border-violet-200"
                            : "bg-gradient-to-br from-orange-100 to-yellow-100 border-2 border-orange-200"
                      }`}
                    >
                      <div className="text-xs font-semibold text-ink-700 mb-1">
                        {msg.senderName} ({isHost ? "Host" : "Guest"}) {isHost && "👑"}
                      </div>
                      <div className="text-ink-900">{msg.message}</div>
                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          alt="Shared"
                          className="mt-2 rounded-lg max-w-full"
                        />
                      )}
                      <div className="text-xs text-ink-500 mt-2">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {isEventEnded ? (
            <div className="border-t-2 border-violet-200 bg-amber-50/80 p-4">
              <div className="text-center text-ink-700">
                <p className="font-medium">⏰ Chat Closed</p>
                <p className="text-sm mt-1">
                  {chatClosedReason || "This event has ended. Chat is no longer available."}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={sendMessage} className="border-t-2 border-violet-200 bg-white/80 p-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-xl border-2 border-violet-200 px-4 py-2 focus:outline-none focus:border-violet-400"
                  disabled={sending || isEventEnded}
                />
                <Button type="submit" disabled={sending || !newMessage.trim() || isEventEnded}>
                  Send
                </Button>
              </div>
              <p className="text-xs text-ink-600 mt-2">
                💬 Temporary chat - Available until event ends
              </p>
            </form>
          )}
        </div>
      </Container>
    </main>
  );
}
