"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/account/user-nav";
import { BecomeHostModal } from "@/components/modals/become-host-modal";
import { getRole, getAccessToken } from "@/lib/session";
import { apiFetch } from "@/lib/http";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Only access localStorage after component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
    setRole(getRole());
  }, []);

  // Listen to session changes (login/logout)
  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    
    const handler = () => {
      setRole(getRole());
    };
    
    window.addEventListener("dah_session_change", handler);
    return () => {
      window.removeEventListener("dah_session_change", handler);
    };
  }, [mounted]);

  // Fetch unread notifications and messages count
  useEffect(() => {
    if (!mounted || !role) return;

    const fetchCounts = async () => {
      const token = getAccessToken();
      if (!token) return;

      try {
        // Fetch notifications count
        const notifRes = await apiFetch<{ notifications: any[] }>("/api/notifications", {
          headers: { authorization: `Bearer ${token}` }
        });
        if (notifRes.ok) {
          const unread = notifRes.data.notifications.filter((n: any) => !n.isRead).length;
          setUnreadNotifications(unread);
        }

        // Fetch messages count (conversations with unread messages)
        const msgRes = await apiFetch<{ conversations: any[] }>("/api/chat/conversations", {
          headers: { authorization: `Bearer ${token}` }
        });
        if (msgRes.ok) {
          const totalUnread = msgRes.data.conversations.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0);
          setUnreadMessages(totalUnread);
        }
      } catch (error) {
        console.error("Error fetching notification/message counts:", error);
      }
    };

    fetchCounts();
    // Poll every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [mounted, role]);

  const handleBecomeHostClick = (e: React.MouseEvent) => {
    if (role === "GUEST") {
      e.preventDefault();
      setIsModalOpen(true);
    }
    // If not logged in or role is null, let the link work normally
  };

  // Show "Become a host" only if not logged in or logged in as GUEST
  // During SSR, always show it to avoid hydration mismatch
  const showBecomeHost = !mounted || !role || role === "GUEST";

  return (
    <div className="min-h-screen text-ink-900">
      <header className="sticky top-0 z-20 border-b-2 border-violet-200 bg-gradient-to-r from-white via-pink-50/50 to-violet-50/50 backdrop-blur-md shadow-sm">
        <Container className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-display text-xl tracking-tight bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 bg-clip-text text-transparent font-bold group-hover:scale-105 transition-transform">
              DineAtHome Social
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/events" className="hidden text-ink-700 hover:text-violet-600 hover:font-semibold transition-colors sm:inline">
              Events
            </Link>
            <Link href="/communities" className="hidden text-ink-700 hover:text-pink-600 hover:font-semibold transition-colors sm:inline">
              Communities
            </Link>
            <Link href="/membership" className="hidden text-ink-700 hover:text-orange-600 hover:font-semibold transition-colors sm:inline">
              Membership
            </Link>
            {showBecomeHost && (
              <Link 
                href="/host" 
                onClick={handleBecomeHostClick}
                className="hidden text-ink-700 hover:text-violet-600 hover:font-semibold transition-colors sm:inline"
              >
                Become a host
              </Link>
            )}
            <Link href="/about" className="hidden text-ink-700 hover:text-sky-600 hover:font-semibold transition-colors sm:inline">
              About
            </Link>
            {mounted && role && (
              <>
                {/* Messages Icon */}
                <Link 
                  href="/messages" 
                  className="hidden sm:inline relative p-2 text-ink-700 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-all"
                  title="Messages"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-violet-500 text-xs font-bold text-white shadow-lg">
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </span>
                  )}
                </Link>

                {/* Notifications Icon */}
                <Link 
                  href="/notifications" 
                  className="hidden sm:inline relative p-2 text-ink-700 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-all"
                  title="Notifications"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-xs font-bold text-white shadow-lg animate-pulse">
                      {unreadNotifications > 9 ? "9+" : unreadNotifications}
                    </span>
                  )}
                </Link>
              </>
            )}
            <UserNav />
          </nav>
        </Container>
      </header>
      
      <BecomeHostModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
      {children}
      <footer className="mt-16 border-t-2 border-violet-200 bg-gradient-to-br from-white via-pink-50/30 to-violet-50/30">
        <Container className="grid gap-8 py-10 md:grid-cols-3">
          <div className="space-y-2">
            <div className="font-display text-lg tracking-tight">
              DineAtHome Social
            </div>
            <div className="text-sm text-ink-700">
              Home-hosted dining, made social.
            </div>
          </div>
          <div className="text-sm text-ink-700">
            <div className="mb-2 font-medium text-ink-900">Explore</div>
            <div className="space-y-1">
              <Link className="block hover:text-ink-900" href="/events">
                Events
              </Link>
              <Link className="block hover:text-ink-900" href="/host">
                Become a host
              </Link>
              <Link className="block hover:text-ink-900" href="/how-it-works">
                How it works
              </Link>
            </div>
          </div>
          <div className="text-sm text-ink-700">
            <div className="mb-2 font-medium text-ink-900">Account</div>
            <div className="space-y-1">
              <Link className="block hover:text-ink-900" href="/profile">
                Profile
              </Link>
              <Link className="block hover:text-ink-900" href="/dashboard">
                Dashboard
              </Link>
            </div>
          </div>
          <div className="md:col-span-3 border-t border-sand-200 pt-6 text-xs text-ink-600">
            © {new Date().getFullYear()} DineAtHome Social. Built with Next.js + MongoDB.
          </div>
        </Container>
      </footer>
    </div>
  );
}

