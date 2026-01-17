"use client";

import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function MembershipPage() {
  return (
    <main className="py-10">
      <Container>
        <div className="mb-12 text-center">
          <h1 className="font-display text-5xl tracking-tight text-ink-900">
            Choose Your Membership
          </h1>
          <p className="mt-3 text-lg text-ink-700">
            Unlock exclusive benefits and save on every dining experience
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Basic - Free */}
          <div className="overflow-hidden rounded-3xl border border-sand-200 bg-white/60 shadow-card backdrop-blur">
            <div className="bg-sand-50 p-6">
              <Badge>Free Forever</Badge>
              <h2 className="mt-3 font-display text-3xl text-ink-900">Basic</h2>
              <div className="mt-2 text-ink-700">
                <span className="text-4xl font-bold text-ink-900">₹0</span> /month
              </div>
            </div>
            <div className="p-6">
              <ul className="space-y-3 text-sm text-ink-700">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Standard booking access</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Browse all events</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Basic customer support</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Rate and review</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Standard platform fees</span>
                </li>
              </ul>
              <Button variant="outline" className="mt-6 w-full">
                Current Plan
              </Button>
            </div>
          </div>

          {/* Premium */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-primary bg-white shadow-lg">
            <div className="absolute right-0 top-0 bg-primary px-4 py-1 text-sm text-white">
              Popular
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6">
              <Badge tone="success">Best Value</Badge>
              <h2 className="mt-3 font-display text-3xl text-ink-900">Premium</h2>
              <div className="mt-2 text-ink-700">
                <span className="text-4xl font-bold text-ink-900">₹499</span> /month
              </div>
            </div>
            <div className="p-6">
              <ul className="space-y-3 text-sm text-ink-700">
                <li className="flex items-start">
                  <span className="mr-2 text-primary">✓</span>
                  <span><strong>10% discount</strong> on all events</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-primary">✓</span>
                  <span><strong>Early access</strong> to new events (24hrs)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-primary">✓</span>
                  <span><strong>No platform fees</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-primary">✓</span>
                  <span>Priority customer support</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-primary">✓</span>
                  <span>Exclusive premium-only events</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-primary">✓</span>
                  <span>Monthly featured host dinner</span>
                </li>
              </ul>
              <Button className="mt-6 w-full">Upgrade to Premium</Button>
              <p className="mt-2 text-center text-xs text-ink-600">
                Cancel anytime, no commitment
              </p>
            </div>
          </div>

          {/* VIP */}
          <div className="overflow-hidden rounded-3xl border border-sand-300 bg-gradient-to-br from-amber-50 to-white shadow-card">
            <div className="bg-gradient-to-r from-amber-100 to-amber-50 p-6">
              <Badge>VIP Experience</Badge>
              <h2 className="mt-3 font-display text-3xl text-ink-900">VIP</h2>
              <div className="mt-2 text-ink-700">
                <span className="text-4xl font-bold text-ink-900">₹999</span> /month
              </div>
            </div>
            <div className="p-6">
              <ul className="space-y-3 text-sm text-ink-700">
                <li className="flex items-start">
                  <span className="mr-2 text-amber-600">✓</span>
                  <span><strong>20% discount</strong> on all events</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-amber-600">✓</span>
                  <span><strong>Free cancellation</strong> (up to 24hrs)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-amber-600">✓</span>
                  <span><strong>Bring a friend free</strong> (once/month)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-amber-600">✓</span>
                  <span>Celebrity chef events access</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-amber-600">✓</span>
                  <span>Concierge booking service</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-amber-600">✓</span>
                  <span>Private dining experiences</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-amber-600">✓</span>
                  <span>All Premium benefits included</span>
                </li>
              </ul>
              <Button className="mt-6 w-full">
                Upgrade to VIP
              </Button>
              <p className="mt-2 text-center text-xs text-ink-600">
                Limited slots available
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 rounded-3xl border border-sand-200 bg-white/60 p-8 shadow-soft backdrop-blur">
          <h2 className="text-center font-display text-2xl text-ink-900">
            Save more with annual billing
          </h2>
          <p className="mt-2 text-center text-ink-700">
            Get 2 months free with annual Premium (₹4,990/year) or VIP (₹9,990/year) plans
          </p>
        </div>
      </Container>
    </main>
  );
}
