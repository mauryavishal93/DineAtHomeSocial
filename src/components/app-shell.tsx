"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/account/user-nav";
import { BecomeHostModal } from "@/components/modals/become-host-modal";
import { getRole, getAccessToken } from "@/lib/session";
import { apiFetch } from "@/lib/http";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Only access localStorage after component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
    setRole(getRole());
  }, []);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

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
        const notifRes = await apiFetch<{ notifications: any[]; unreadCount?: number }>("/api/notifications", {
          headers: { authorization: `Bearer ${token}` }
        });
        if (notifRes.ok && notifRes.data) {
          // Use unreadCount if available, otherwise calculate from notifications
          const unread = notifRes.data.unreadCount ?? (notifRes.data.notifications?.filter((n: any) => !n.isRead).length ?? 0);
          setUnreadNotifications(unread);
        } else if (!notifRes.ok) {
          // If notifications API fails, just set to 0 - don't break the app
          console.warn("Failed to fetch notifications:", notifRes.error);
          setUnreadNotifications(0);
        }

        // Fetch messages count (conversations with unread messages)
        const msgRes = await apiFetch<{ conversations: any[] }>("/api/chat/conversations", {
          headers: { authorization: `Bearer ${token}` }
        });
        if (msgRes.ok) {
          const totalUnread = msgRes.data.conversations.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0);
          setUnreadMessages(totalUnread);
        } else if (!msgRes.ok) {
          // If messages API fails, just set to 0 - don't break the app
          console.warn("Failed to fetch messages:", msgRes.error);
          setUnreadMessages(0);
        }
      } catch (error) {
        console.error("Error fetching notification/message counts:", error);
        // Set to 0 on error to prevent UI issues
        setUnreadNotifications(0);
        setUnreadMessages(0);
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
        <Container className="flex items-center justify-between gap-2 py-3 sm:py-4 min-h-[52px]">
          <Link href="/" className="flex min-w-0 items-center gap-2 group shrink-0" aria-label="DineAtHome Social home">
            <Image src="/logo.png" alt="" width={40} height={40} className="shrink-0 rounded-lg w-10 h-10 sm:w-9 sm:h-9" />
            <span className="font-display text-base sm:text-lg md:text-xl tracking-tight bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 bg-clip-text text-transparent font-bold group-hover:scale-105 transition-transform truncate hidden sm:inline">
              DineAtHome Social
            </span>
          </Link>
          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-2 md:gap-4 text-sm font-medium shrink-0">
            <Link href="/events" className="text-ink-700 hover:text-violet-600 hover:font-semibold transition-colors">
              Events
            </Link>
            <Link href="/communities" className="hidden md:inline text-ink-700 hover:text-pink-600 hover:font-semibold transition-colors">
              Communities
            </Link>
            <Link href="/membership" className="hidden md:inline text-ink-700 hover:text-orange-600 hover:font-semibold transition-colors">
              Membership
            </Link>
            {showBecomeHost && (
              <Link 
                href="/host" 
                onClick={handleBecomeHostClick}
                className="text-ink-700 hover:text-violet-600 hover:font-semibold transition-colors"
              >
                Become a host
              </Link>
            )}
            <Link href="/about" className="text-ink-700 hover:text-sky-600 hover:font-semibold transition-colors">
              About
            </Link>
            {mounted && role && (
              <>
                <Link 
                  href="/messages" 
                  className="relative p-2 text-ink-700 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-all"
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
                <Link 
                  href="/notifications" 
                  className="relative p-2 text-ink-700 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-all"
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
          {/* Mobile: logo is left; keep Login/Join or Account + menu visible */}
          <div className="flex sm:hidden items-center gap-2 shrink-0 min-h-[44px]">
            {mounted && role && (
              <>
                <Link href="/messages" className="relative p-2.5 text-ink-700 rounded-full touch-manipulation" title="Messages" aria-label="Messages">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  {unreadMessages > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-violet-500 text-[10px] font-bold text-white">{unreadMessages > 9 ? "9+" : unreadMessages}</span>
                  )}
                </Link>
                <Link href="/notifications" className="relative p-2.5 text-ink-700 rounded-full touch-manipulation" title="Notifications" aria-label="Notifications">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-[10px] font-bold text-white animate-pulse">{unreadNotifications > 9 ? "9+" : unreadNotifications}</span>
                  )}
                </Link>
              </>
            )}
            <button
              type="button"
              onClick={() => setMobileNavOpen((o) => !o)}
              className="p-2.5 text-ink-700 rounded-lg hover:bg-sand-100 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileNavOpen}
            >
              {mobileNavOpen ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
            <UserNav />
          </div>
        </Container>
        {/* Mobile nav dropdown */}
        {mobileNavOpen && (
          <div className="sm:hidden border-t border-violet-200 bg-white/95 backdrop-blur-md">
            <nav className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-3 flex flex-col gap-1">
              <Link href="/events" className="px-4 py-3 rounded-xl text-ink-800 font-medium hover:bg-violet-50" onClick={() => setMobileNavOpen(false)}>Events</Link>
              <Link href="/communities" className="px-4 py-3 rounded-xl text-ink-800 font-medium hover:bg-pink-50" onClick={() => setMobileNavOpen(false)}>Communities</Link>
              <Link href="/membership" className="px-4 py-3 rounded-xl text-ink-800 font-medium hover:bg-orange-50" onClick={() => setMobileNavOpen(false)}>Membership</Link>
              {showBecomeHost && (
                <Link href="/host" className="px-4 py-3 rounded-xl text-ink-800 font-medium hover:bg-violet-50" onClick={(e) => { handleBecomeHostClick(e); setMobileNavOpen(false); }}>Become a host</Link>
              )}
              <Link href="/about" className="px-4 py-3 rounded-xl text-ink-800 font-medium hover:bg-sky-50" onClick={() => setMobileNavOpen(false)}>About</Link>
            </nav>
          </div>
        )}
      </header>
      
      <BecomeHostModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
      {children}
      <footer className="mt-12 sm:mt-16 border-t-2 border-violet-200 bg-gradient-to-br from-white via-pink-50/30 to-violet-50/30">
        <Container className="grid gap-6 sm:gap-8 py-8 sm:py-10 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="" width={28} height={28} className="rounded-lg" />
              <span className="font-display text-lg tracking-tight">DineAtHome Social</span>
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
              {(!role || role === "GUEST") && (
                <Link className="block hover:text-ink-900" href="/host">
                  Become a host
                </Link>
              )}
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
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>© {new Date().getFullYear()} DineAtHome Social.</div>
              <div className="flex gap-4">
                <Link href="/terms" className="hover:text-ink-900">
                  Terms & Conditions
                </Link>
                <Link href="/support" className="hover:text-ink-900">
                  Support
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}

