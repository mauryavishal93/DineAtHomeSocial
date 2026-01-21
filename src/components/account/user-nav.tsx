"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/http";
import { clearSession, getAccessToken, getRole } from "@/lib/session";

type Me = {
  userId: string;
  email: string;
  role: "ADMIN" | "HOST" | "GUEST";
  displayName: string;
};

export function UserNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Only access localStorage after component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
    setToken(getAccessToken());
    setRole(getRole());
  }, []);

  // Listen to session changes (login/logout)
  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    
    const handler = () => {
      setToken(getAccessToken());
      setRole(getRole());
    };
    
    window.addEventListener("dah_session_change", handler);
    return () => {
      window.removeEventListener("dah_session_change", handler);
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !token) {
      setMe(null);
      return;
    }
    (async () => {
      try {
        const res = await apiFetch<Me>("/api/me", {
          method: "GET",
          headers: { authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          // For admin users on admin pages, don't clear session on /api/me failure
          // as they might be using admin-specific endpoints
          if (pathname?.startsWith("/admin") && role === "ADMIN") {
            console.warn("Admin user on admin page - skipping /api/me failure");
            return;
          }
          // Token likely expired or invalid; clear local session.
          clearSession();
          setMe(null);
          return;
        }
        setMe(res.data);
      } catch (error) {
        console.error("Error fetching /api/me:", error);
        // Don't clear session on network errors for admin pages
        if (pathname?.startsWith("/admin") && role === "ADMIN") {
          return;
        }
        clearSession();
        setMe(null);
      }
    })();
  }, [mounted, token, pathname, role]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const onLogout = useMemo(
    () => async () => {
      await apiFetch("/api/auth/logout", { method: "POST" });
      clearSession();
      setIsDropdownOpen(false);
      // State will update automatically via useSessionChange listener
      router.push("/");
    },
    [router]
  );

  // During SSR or before mount, always show login buttons to avoid hydration mismatch
  if (!mounted || !token || !role) {
    return (
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/auth/login">Login</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/auth/register">Join</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2"
      >
        <span>Account</span>
        <svg
          className={`h-4 w-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-sand-200 bg-white shadow-lg z-50">
          <div className="border-b border-sand-200 px-4 py-3">
            <p className="text-sm font-medium text-ink-900">Hi, {me?.displayName || "there"}</p>
            <p className="text-xs text-ink-600">{me?.email}</p>
          </div>

          <div className="py-2">
            <Link
              href="/profile"
              onClick={() => setIsDropdownOpen(false)}
              className="block px-4 py-2 text-sm text-ink-700 hover:bg-sand-50 transition-colors"
            >
              Profile
            </Link>

            {role === "GUEST" && (
              <>
                <Link
                  href="/bookings"
                  onClick={() => setIsDropdownOpen(false)}
                  className="block px-4 py-2 text-sm text-ink-700 hover:bg-sand-50 transition-colors"
                >
                  My Bookings
                </Link>
                <Link
                  href="/host"
                  onClick={() => setIsDropdownOpen(false)}
                  className="block px-4 py-2 text-sm text-ink-700 hover:bg-sand-50 transition-colors"
                >
                  Become a Host
                </Link>
                <Link
                  href="/payments"
                  onClick={() => setIsDropdownOpen(false)}
                  className="block px-4 py-2 text-sm text-ink-700 hover:bg-sand-50 transition-colors"
                >
                  Payments
                </Link>
                <Link
                  href="/referrals"
                  onClick={() => setIsDropdownOpen(false)}
                  className="block px-4 py-2 text-sm text-ink-700 hover:bg-sand-50 transition-colors"
                >
                  Referral
                </Link>
                <Link
                  href="/support"
                  onClick={() => setIsDropdownOpen(false)}
                  className="block px-4 py-2 text-sm text-ink-700 hover:bg-sand-50 transition-colors"
                >
                  Help
                </Link>
              </>
            )}

            {role === "HOST" && (
              <>
                <Link
                  href="/host/my-events"
                  onClick={() => setIsDropdownOpen(false)}
                  className="block px-4 py-2 text-sm text-ink-700 hover:bg-sand-50 transition-colors"
                >
                  My Events
                </Link>
                <Link
                  href="/referrals"
                  onClick={() => setIsDropdownOpen(false)}
                  className="block px-4 py-2 text-sm text-ink-700 hover:bg-sand-50 transition-colors"
                >
                  Referral
                </Link>
                <Link
                  href="/support"
                  onClick={() => setIsDropdownOpen(false)}
                  className="block px-4 py-2 text-sm text-ink-700 hover:bg-sand-50 transition-colors"
                >
                  Help
                </Link>
              </>
            )}

            <button
              onClick={onLogout}
              className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
