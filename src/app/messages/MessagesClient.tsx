"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/http";
import { getAccessToken, getRole } from "@/lib/session";
import {
  getChatAesKey,
  encryptChatMessage,
  decryptChatMessage,
  isEncryptedPayload
} from "@/lib/chat-e2e";

type Conversation = {
  bookingId: string;
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

type Message = {
  id: string;
  eventSlotId: string;
  bookingId?: string;
  senderUserId: string;
  senderName: string;
  senderRole: "HOST" | "GUEST";
  message: string;
  messageType: string;
  imageUrl: string;
  createdAt: string;
  isRead: boolean;
};

export default function MessagesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedEventId = searchParams.get("eventId");
  const selectedBookingId = searchParams.get("bookingId");
  const token = getAccessToken();
  const [role, setRole] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isEventEnded, setIsEventEnded] = useState(false);
  const [chatClosedReason, setChatClosedReason] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [e2eReady, setE2eReady] = useState(false);
  const [e2ePending, setE2ePending] = useState(false);
  const [decryptedById, setDecryptedById] = useState<Record<string, string>>({});
  const aesKeyRef = useRef<CryptoKey | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousMessagesLengthRef = useRef(0);
  const hasScrolledUpRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const lastMessageIdRef = useRef<string | null>(null);
  const previousScrollHeightRef = useRef(0);
  const userInitiatedScrollRef = useRef(false);

  useEffect(() => {
    setRole(getRole());
  }, []);

  useEffect(() => {
    if (!token) {
      router.push("/auth/login");
      return;
    }

    loadConversations();
    
    // Poll for new conversations every 10 seconds
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, [token, router]);

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

  // E2E session for selected thread (ECDH + AES-GCM; ciphertext on server)
  useEffect(() => {
    if (!token || !selectedConv?.bookingId) {
      setE2eReady(false);
      setE2ePending(false);
      aesKeyRef.current = null;
      return;
    }
    let cancelled = false;
    const side = selectedConv.isHost ? "host" : "guest";
    const bid = selectedConv.bookingId;
    setE2ePending(true);
    setE2eReady(false);
    aesKeyRef.current = null;

    let pollTimer: ReturnType<typeof setInterval> | null = null;
    const tryKey = async () => {
      const { aesKey, ready } = await getChatAesKey(bid, token, side);
      if (cancelled) return;
      if (ready && aesKey) {
        aesKeyRef.current = aesKey;
        setE2eReady(true);
        setE2ePending(false);
        if (pollTimer) {
          clearInterval(pollTimer);
          pollTimer = null;
        }
      }
    };

    void tryKey();
    pollTimer = setInterval(() => void tryKey(), 2500);

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [token, selectedConv?.bookingId, selectedConv?.isHost]);

  // Decrypt messages when key or list changes
  useEffect(() => {
    const key = aesKeyRef.current;
    if (!key || messages.length === 0) {
      if (messages.length === 0) setDecryptedById({});
      return;
    }
    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      await Promise.all(
        messages.map(async (m) => {
          if (!isEncryptedPayload(m.message)) {
            next[m.id] = m.message;
            return;
          }
          try {
            next[m.id] = await decryptChatMessage(m.message, key);
          } catch {
            next[m.id] = "[Unable to decrypt]";
          }
        })
      );
      if (!cancelled) setDecryptedById(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [messages, e2eReady]);

  // Load selected conversation and messages (deep link works before conversation list loads)
  useEffect(() => {
    if (selectedEventId && selectedBookingId && token) {
      const conv = conversations.find(
        (c) => c.eventSlotId === selectedEventId && c.bookingId === selectedBookingId
      );

      if (conv) {
        setSelectedConv(conv);
      } else {
        const r = getRole();
        setSelectedConv({
          bookingId: selectedBookingId,
          eventSlotId: selectedEventId,
          eventName: "Event",
          eventDate: "",
          venueName: "",
          venueAddress: "",
          otherPartyName: "…",
          otherPartyId: "",
          otherPartyRole: r === "HOST" ? "GUEST" : "HOST",
          latestMessage: null,
          unreadCount: 0,
          isHost: r === "HOST",
          isEventEnded: false
        });
      }

      previousMessagesLengthRef.current = 0;
      lastMessageIdRef.current = null;
      hasScrolledUpRef.current = false;
      isInitialLoadRef.current = true;
      previousScrollHeightRef.current = 0;
      userInitiatedScrollRef.current = false;
      setIsNearBottom(true);
      loadChatMessages(selectedEventId, selectedBookingId);

      const interval = setInterval(() => loadChatMessages(selectedEventId, selectedBookingId), 3000);
      return () => clearInterval(interval);
    }

    setSelectedConv(null);
    setMessages([]);
    previousMessagesLengthRef.current = 0;
    lastMessageIdRef.current = null;
    hasScrolledUpRef.current = false;
    isInitialLoadRef.current = true;
    previousScrollHeightRef.current = 0;
    userInitiatedScrollRef.current = false;
  }, [selectedEventId, selectedBookingId, conversations, token]);

  // Track scroll position - detect user-initiated scrolls
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let lastScrollTop = container.scrollTop;
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const nearBottom = distanceFromBottom < 100;
      
      // Detect if this is user-initiated scroll (not programmatic)
      const scrollDelta = Math.abs(scrollTop - lastScrollTop);
      if (scrollDelta > 10) { // Significant scroll movement
        userInitiatedScrollRef.current = true;
        // Mark as user scroll
        if (!nearBottom) {
          hasScrolledUpRef.current = true;
        } else {
          hasScrolledUpRef.current = false;
        }
      }
      
      setIsNearBottom(nearBottom);
      lastScrollTop = scrollTop;
      
      // Clear user scroll flag after scroll ends
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        userInitiatedScrollRef.current = false;
      }, 150);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [selectedConv]);

  // Auto-scroll ONLY when explicitly needed - prevent all unwanted scrolling
  useEffect(() => {
    if (messages.length === 0) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    const previousLength = previousMessagesLengthRef.current;
    const lastMessage = messages[messages.length - 1];
    const currentLastMessageId = lastMessage?.id || null;
    
    // Check if content actually changed (scrollHeight changed)
    const currentScrollHeight = container.scrollHeight;
    const contentChanged = currentScrollHeight !== previousScrollHeightRef.current;
    
    // Check if it's truly a new message (different ID) or just a refresh
    const isTrulyNewMessage = currentLastMessageId !== lastMessageIdRef.current && currentLastMessageId !== null;
    const isNewMessage = messages.length > previousLength;
    
    // CRITICAL: If user is actively scrolling or has scrolled up, NEVER auto-scroll (except for their own NEW message)
    if (userInitiatedScrollRef.current || hasScrolledUpRef.current) {
      // Only allow scroll if user sent their own new message
      const isOwnNewMessage = isTrulyNewMessage && isNewMessage && currentUserId && 
                              String(lastMessage?.senderUserId) === String(currentUserId);
      
      if (!isOwnNewMessage) {
        // Just update refs, don't scroll
        previousMessagesLengthRef.current = messages.length;
        previousScrollHeightRef.current = currentScrollHeight;
        if (currentLastMessageId) {
          lastMessageIdRef.current = currentLastMessageId;
        }
        return;
      }
    }
    
    // Check actual scroll position RIGHT NOW
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const actuallyNearBottom = distanceFromBottom < 100;

    // Only check for own message if it's truly new
    const isOwnNewMessage = isTrulyNewMessage && isNewMessage && currentUserId && 
                            String(lastMessage?.senderUserId) === String(currentUserId);

    // STRICT conditions - only scroll if:
    // 1. Initial load (first time, no previous messages), OR
    // 2. User sent their own NEW message, OR  
    // 3. Content changed AND user is at bottom AND it's a truly NEW message from someone else
    const isInitialLoad = isInitialLoadRef.current && previousLength === 0;
    const shouldScroll = isInitialLoad || 
                         isOwnNewMessage || 
                         (contentChanged && actuallyNearBottom && isTrulyNewMessage && isNewMessage && !isOwnNewMessage);

    if (shouldScroll) {
      // Final safety check - only scroll if really needed
      const finalCheck = container.scrollHeight - container.scrollTop - container.clientHeight;
      if (finalCheck >= 200 && !isInitialLoad && !isOwnNewMessage) {
        // User is not at bottom, don't scroll
        previousMessagesLengthRef.current = messages.length;
        previousScrollHeightRef.current = currentScrollHeight;
        if (currentLastMessageId) {
          lastMessageIdRef.current = currentLastMessageId;
        }
        return;
      }
      
      requestAnimationFrame(() => {
        scrollToBottom();
      });
      
      // Mark initial load as complete after first scroll
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
      }
    }

    previousMessagesLengthRef.current = messages.length;
    previousScrollHeightRef.current = currentScrollHeight;
    if (currentLastMessageId) {
      lastMessageIdRef.current = currentLastMessageId;
    }
  }, [messages, currentUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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

  // Legacy URL: ?eventId= only (guest) → attach bookingId from conversation list
  useEffect(() => {
    if (!selectedEventId || selectedBookingId || conversations.length === 0) return;
    const conv = conversations.find((c) => c.eventSlotId === selectedEventId);
    if (conv?.bookingId) {
      router.replace(`/messages?eventId=${selectedEventId}&bookingId=${conv.bookingId}`);
    }
  }, [selectedEventId, selectedBookingId, conversations, router]);

  const loadChatMessages = async (eventId: string, bookingId: string) => {
    if (!token || !eventId || !bookingId) return;
    
    setLoadingMessages(true);
    const res = await apiFetch<{
      messages: Message[];
      isEventEnded?: boolean;
      eventName?: string;
      bookingId?: string;
    }>(
      `/api/chat?eventSlotId=${encodeURIComponent(eventId)}&bookingId=${encodeURIComponent(bookingId)}`,
      {
        headers: { authorization: `Bearer ${token}` }
      }
    );
    
    if (res.ok && res.data) {
      const newMessages = res.data.messages || [];
      setMessages(newMessages);
      setIsEventEnded(res.data.isEventEnded || false);
      setChatClosedReason(null);
      setLoadingMessages(false);
      // Don't scroll here - let the useEffect handle it based on scroll position
    } else if (!res.ok && res.error?.includes("cancelled")) {
      setChatClosedReason("Your booking for this event has been cancelled.");
      setIsEventEnded(true);
      setLoadingMessages(false);
    } else {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedConv || !newMessage.trim() || sending || isEventEnded) return;
    if (!e2eReady || !aesKeyRef.current) {
      alert("Securing private channel… please wait until both sides have opened chat, then try again.");
      return;
    }

    setSending(true);
    let bodyText = newMessage.trim();
    try {
      bodyText = await encryptChatMessage(newMessage.trim(), aesKeyRef.current);
    } catch {
      setSending(false);
      alert("Encryption failed. Please try again.");
      return;
    }

    const res = await apiFetch<{ message: Message }>("/api/chat", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        eventSlotId: selectedConv.eventSlotId,
        bookingId: selectedConv.bookingId,
        message: bodyText
      })
    });

    if (res.ok && res.data) {
      const added = res.data.message;
      setMessages([...messages, added]);
      try {
        if (aesKeyRef.current && isEncryptedPayload(added.message)) {
          const plain = await decryptChatMessage(added.message, aesKeyRef.current);
          setDecryptedById((prev) => ({ ...prev, [added.id]: plain }));
        }
      } catch {
        /* ignore */
      }
      setNewMessage("");
      loadConversations(); // Refresh conversation list
      // Always scroll when user sends a message - handled by useEffect
    } else if (!res.ok && res.error?.includes("Chat is closed")) {
      setIsEventEnded(true);
      loadChatMessages(selectedConv.eventSlotId, selectedConv.bookingId);
    }
    setSending(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" }) + " " +
           date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <main className="flex h-[calc(100vh-80px)]">
        <Container className="flex items-center justify-center">
          <div className="text-center text-ink-700">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600 mx-auto mb-4" />
            <p>Loading conversations...</p>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="flex h-[calc(100vh-80px)] bg-sand-50/50">
      <div className="flex w-full h-full">
        {/* Left Sidebar - Conversation List */}
        <div className="w-full md:w-96 lg:w-[400px] border-r border-sand-200 bg-white flex flex-col h-full overflow-hidden shrink-0">
          {/* Header */}
          <div className="p-4 border-b border-sand-200 bg-gradient-to-r from-violet-50 to-pink-50">
            <h1 className="font-display text-2xl font-bold text-ink-900">Messages</h1>
            <p className="text-sm text-ink-600 mt-1">{conversations.length} conversation{conversations.length !== 1 ? "s" : ""}</p>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-ink-600">
                <div className="text-5xl mb-4">💬</div>
                <p className="font-medium mb-2">No conversations yet</p>
                <p className="text-sm mb-4">Start chatting by booking or hosting an event!</p>
                <div className="flex flex-col gap-2">
                  <Button size="sm" asChild>
                    <Link href="/events">Browse Events</Link>
                  </Button>
                  {role === "GUEST" && (
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/host">Become a Host</Link>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="divide-y divide-sand-100">
                {conversations.map((conv) => {
                  const isSelected =
                    selectedEventId === conv.eventSlotId && selectedBookingId === conv.bookingId;
                  return (
                    <button
                      key={conv.bookingId}
                      type="button"
                      onClick={() =>
                        router.push(
                          `/messages?eventId=${conv.eventSlotId}&bookingId=${conv.bookingId}`
                        )
                      }
                      className={`w-full text-left p-4 hover:bg-sand-50 transition-colors ${
                        isSelected ? "bg-violet-50 border-l-4 border-violet-500" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                          {getInitials(conv.otherPartyName)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-ink-900 truncate">{conv.otherPartyName}</h3>
                            {conv.latestMessage && (
                              <span className="text-xs text-ink-500 shrink-0">
                                {formatTime(conv.latestMessage.createdAt)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge tone={conv.isHost ? "violet" : "orange"} className="text-[10px] px-1.5 py-0">
                              {conv.isHost ? "Host" : "Guest"}
                            </Badge>
                            {conv.isEventEnded && (
                              <Badge tone="ink" className="text-[10px] px-1.5 py-0">Closed</Badge>
                            )}
                          </div>
                          <p className="text-sm text-ink-600 truncate mb-1">{conv.eventName}</p>
                          {conv.latestMessage && (
                            <p className="text-sm text-ink-700 truncate">
                              <span className="font-medium">{conv.latestMessage.senderName}:</span>{" "}
                              {conv.latestMessage.message}
                            </p>
                          )}
                        </div>

                        {/* Unread Badge */}
                        {conv.unreadCount > 0 && (
                          <div className="shrink-0 w-6 h-6 rounded-full bg-violet-500 text-white text-xs font-bold flex items-center justify-center">
                            {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Chat View */}
        <div className="flex-1 hidden md:flex flex-col h-full bg-white">
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-sand-200 bg-gradient-to-r from-violet-50 to-pink-50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                  {getInitials(selectedConv.otherPartyName)}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-ink-900 truncate">{selectedConv.otherPartyName}</h2>
                  <p className="text-xs text-ink-600 truncate">{selectedConv.eventName}</p>
                </div>
                {selectedConv.isEventEnded && (
                  <Badge tone="ink" className="text-xs">Chat Closed</Badge>
                )}
                {!selectedConv.isEventEnded && e2ePending && (
                  <Badge tone="warning" className="text-xs">Securing…</Badge>
                )}
                {!selectedConv.isEventEnded && e2eReady && (
                  <Badge tone="success" className="text-xs">🔒 Private</Badge>
                )}
              </div>

              {/* Messages Area */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-white to-sand-50/30"
              >
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-ink-600">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600 mx-auto mb-2" />
                      <p className="text-sm">Loading messages...</p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-ink-600 py-12">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isOwnMessage = currentUserId ? String(msg.senderUserId) === String(currentUserId) : false;
                    const prevMsg = idx > 0 ? messages[idx - 1] : null;
                    const showAvatar = !prevMsg || prevMsg.senderUserId !== msg.senderUserId || 
                                      new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 300000; // 5 min
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2 ${isOwnMessage ? "justify-end" : "justify-start"} items-end`}
                      >
                        {!isOwnMessage && showAvatar && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-300 to-pink-300 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                            {getInitials(msg.senderName)}
                          </div>
                        )}
                        {!isOwnMessage && !showAvatar && <div className="w-8 shrink-0" />}
                        <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? "items-end" : "items-start"}`}>
                          {showAvatar && (
                            <span className="text-xs text-ink-600 mb-1 px-2">{msg.senderName}</span>
                          )}
                          <div
                            className={`rounded-2xl px-4 py-2 shadow-sm ${
                              isOwnMessage
                                ? "bg-violet-500 text-white rounded-br-sm"
                                : "bg-white border border-sand-200 text-ink-900 rounded-bl-sm"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {decryptedById[msg.id] ??
                                (isEncryptedPayload(msg.message) ? "🔒 …" : msg.message)}
                            </p>
                            {msg.imageUrl && (
                              <img
                                src={msg.imageUrl}
                                alt="Shared"
                                className="mt-2 rounded-lg max-w-full max-h-64 object-contain"
                              />
                            )}
                          </div>
                          <span className={`text-[10px] text-ink-500 mt-1 px-2 ${isOwnMessage ? "text-right" : "text-left"}`}>
                            {formatMessageTime(msg.createdAt)}
                          </span>
                        </div>
                        {isOwnMessage && !showAvatar && <div className="w-8 shrink-0" />}
                        {isOwnMessage && showAvatar && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                            {getInitials(msg.senderName)}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              {isEventEnded ? (
                <div className="border-t border-sand-200 bg-amber-50/80 p-4">
                  <div className="text-center text-ink-700">
                    <p className="font-medium text-sm">⏰ Chat Closed</p>
                    <p className="text-xs mt-1">
                      {chatClosedReason || "This event has ended. Chat is no longer available."}
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={sendMessage} className="border-t border-sand-200 bg-white p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={
                        e2eReady ? "Type a message (end-to-end encrypted)…" : "Waiting for secure channel…"
                      }
                      disabled={sending || isEventEnded || !e2eReady}
                      className="flex-1 rounded-xl border-2 border-sand-200 px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400 disabled:bg-sand-50 disabled:text-ink-500 disabled:cursor-not-allowed"
                    />
                    <Button
                      type="submit"
                      disabled={sending || !newMessage.trim() || isEventEnded || !e2eReady}
                      className="shrink-0"
                    >
                      {sending ? "Sending..." : "Send"}
                    </Button>
                  </div>
                  <p className="text-xs text-ink-500 mt-2 px-1">
                    🔒 Messages are end-to-end encrypted. Only you and the other party can read them.
                    Chat closes when the event ends.
                  </p>
                </form>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div>
                <div className="text-6xl mb-4">💬</div>
                <h2 className="font-display text-xl font-semibold text-ink-900 mb-2">
                  Select a conversation
                </h2>
                <p className="text-ink-600 text-sm">
                  Choose a conversation from the sidebar to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

