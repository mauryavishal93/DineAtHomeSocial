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
  const token = getAccessToken();
  const role = getRole();

  const [me, setMe] = useState<Me | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) {
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
  }, [token, pathname, role]);

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
      router.push("/");
      router.refresh();
    },
    [router]
  );

  if (!token || !role) {
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
              <Link
                href="/bookings"
                onClick={() => setIsDropdownOpen(false)}
                className="block px-4 py-2 text-sm text-ink-700 hover:bg-sand-50 transition-colors"
              >
                My Bookings
              </Link>
            )}

            {role === "HOST" && (
              <Link
                href="/host/my-events"
                onClick={() => setIsDropdownOpen(false)}
                className="block px-4 py-2 text-sm text-ink-700 hover:bg-sand-50 transition-colors"
              >
                My Events
              </Link>
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
