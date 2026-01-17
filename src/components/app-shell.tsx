"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/account/user-nav";
import { BecomeHostModal } from "@/components/modals/become-host-modal";
import { getRole } from "@/lib/session";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const role = getRole();

  const handleBecomeHostClick = (e: React.MouseEvent) => {
    if (role === "GUEST") {
      e.preventDefault();
      setIsModalOpen(true);
    }
    // If not logged in or role is null, let the link work normally
  };

  // Show "Become a host" only if not logged in or logged in as GUEST
  const showBecomeHost = !role || role === "GUEST";

  return (
    <div className="min-h-screen text-ink-900">
      <header className="sticky top-0 z-20 border-b border-sand-200 bg-sand-50/70 backdrop-blur">
        <Container className="flex items-center justify-between py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-display text-lg tracking-tight">
              DineAtHome Social
            </span>
          </Link>
          <nav className="flex items-center gap-3 text-sm text-ink-700">
            <Link href="/events" className="hidden hover:text-ink-900 sm:inline">
              Events
            </Link>
            <Link href="/communities" className="hidden hover:text-ink-900 sm:inline">
              Communities
            </Link>
            <Link href="/membership" className="hidden hover:text-ink-900 sm:inline">
              Membership
            </Link>
            {showBecomeHost && (
              <Link 
                href="/host" 
                onClick={handleBecomeHostClick}
                className="hidden hover:text-ink-900 sm:inline"
              >
                Become a host
              </Link>
            )}
            <Link href="/about" className="hidden hover:text-ink-900 sm:inline">
              About
            </Link>
            <UserNav />
          </nav>
        </Container>
      </header>
      
      <BecomeHostModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
      {children}
      <footer className="mt-16 border-t border-sand-200 bg-sand-50/60">
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

