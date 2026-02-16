"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge } from "./verification-badge";

export type UIEvent = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  seatsLeft: number;
  maxGuests: number;
  priceFrom: number;
  locality: string;
  city?: string;
  venueName: string;
  hostName: string;
  hostUserId: string;
  hostRating: number;
  verified: boolean;
  governmentIdPath?: string;
  hostStatus?: string;
  foodTags: string[];
  cuisines?: string[];
  foodType?: string;
  activities?: string[];
  eventImages?: Array<{ filePath: string; fileMime: string; fileName: string; uploadedAt?: Date }>;
  eventVideos?: Array<{ filePath: string; fileMime: string; fileName: string; uploadedAt?: Date }>;
};

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  // Use 'en-US' locale to ensure consistent formatting between server and client
  return new Intl.DateTimeFormat("en-US", { weekday: "short", day: "2-digit", month: "short" }).format(d);
}

function formatTimeLabel(startIso: string, endIso: string) {
  const s = new Date(startIso);
  const e = new Date(endIso);
  // Use 'en-US' locale to ensure consistent formatting between server and client
  const tf = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
  return `${tf.format(s)} – ${tf.format(e)}`;
}

export function EventCard({ ev }: { ev: UIEvent }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  
  // Only compute date labels on client to avoid hydration mismatches
  const dateLabel = mounted ? formatDateLabel(ev.startAt) : "";
  const timeLabel = mounted ? formatTimeLabel(ev.startAt, ev.endAt) : "";

  useEffect(() => {
    setMounted(true);
  }, []);

  const eventImages = ev.eventImages || [];
  const eventVideos = ev.eventVideos || [];
  const allMedia = [...eventImages, ...eventVideos];
  const hasMedia = allMedia.length > 0;

  // Auto-advance slideshow for event cards (only if multiple media items)
  useEffect(() => {
    if (allMedia.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % allMedia.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [allMedia.length]);

  return (
    <Link
      href={`/events/${ev.id}`}
      className="group block min-w-0 overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-violet-100 bg-gradient-to-br from-white via-pink-50/30 to-violet-50/30 shadow-lg backdrop-blur transition-all duration-300 hover:-translate-y-1 sm:hover:-translate-y-2 hover:shadow-colorful hover:border-violet-200 active:scale-[0.99]"
    >
      <div className="relative min-w-0">
        <div className="relative h-40 sm:h-44 overflow-hidden">
          {hasMedia ? (
            // Media Slideshow
            <div className="relative h-full w-full">
              {allMedia.map((media, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 h-full w-full transition-opacity duration-1000 ${
                    idx === currentSlideIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                  }`}
                >
                  {media.filePath.startsWith("event-images/") ? (
                    <img
                      src={`/api/upload/serve?path=${encodeURIComponent(media.filePath)}`}
                      alt={media.fileName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <video
                      src={`/api/upload/serve?path=${encodeURIComponent(media.filePath)}`}
                      className="h-full w-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                      onEnded={() => {
                        if (allMedia.length > 1) {
                          setCurrentSlideIndex((prev) => (prev + 1) % allMedia.length);
                        }
                      }}
                    />
                  )}
                </div>
              ))}
              {/* Overlay gradient for better text readability */}
              <div className="absolute inset-0 h-full w-full bg-gradient-to-t from-black/40 via-transparent to-transparent z-10" />
            </div>
          ) : (
            // Fallback gradient
            <div className="relative h-full w-full bg-gradient-to-br from-sand-100 via-white to-sand-50">
              <svg
                className="absolute inset-0 h-full w-full opacity-[0.35]"
                viewBox="0 0 600 220"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M0,160 C120,120 220,200 330,170 C430,145 480,70 600,105 L600,220 L0,220 Z"
                  fill="#dbc7ad"
                  fillOpacity="0.55"
                />
                <path
                  d="M0,120 C90,95 210,150 320,125 C430,100 490,40 600,70"
                  fill="none"
                  stroke="#b78a59"
                  strokeOpacity="0.35"
                  strokeWidth="2"
                />
              </svg>
            </div>
          )}
          <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 rounded-full border-2 border-white/80 bg-gradient-to-r from-white/90 via-pink-50/90 to-violet-50/90 backdrop-blur-sm px-3 py-1.5 text-xs text-ink-700 shadow-lg">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-pink-500 to-orange-500 text-white font-bold shadow-md">
              {ev.hostName.slice(0, 1).toUpperCase()}
            </span>
            {ev.hostUserId && ev.hostUserId !== "undefined" ? (
              <span
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/hosts/${ev.hostUserId}`);
                }}
                className="font-medium text-ink-900 hover:text-ink-600 hover:underline cursor-pointer"
              >
                {ev.hostName}
              </span>
            ) : (
              <span className="font-medium text-ink-900">{ev.hostName}</span>
            )}
            <span className="text-ink-600">• {ev.hostRating.toFixed(1)}</span>
          </div>
        </div>
        <div className="absolute left-4 top-4 z-20 flex gap-2 flex-wrap">
          <VerificationBadge isIdentityVerified={ev.verified} governmentIdPath={ev.governmentIdPath} />
          {ev.hostStatus === "SUSPENDED" ? (
            <Badge tone="warning" className="bg-red-100 text-red-800 border-red-300">
              ⚠️ Host Suspended
            </Badge>
          ) : null}
          {ev.seatsLeft <= 3 && ev.hostStatus !== "SUSPENDED" ? <Badge tone="warning">⚡ Few seats</Badge> : null}
        </div>
      </div>
      <div className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2 sm:gap-3 min-w-0">
          <div className="min-w-0 flex-1">
            <div className="font-display text-base sm:text-lg leading-tight text-ink-900 line-clamp-2">
              {ev.title}
            </div>
            <div className="mt-1 text-sm text-ink-700 truncate">{ev.venueName}</div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-lg font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">₹{Math.round(ev.priceFrom)}</div>
            <div className="text-xs text-ink-600 font-medium">from / guest</div>
          </div>
        </div>

        <div className="mt-4 grid gap-1 text-sm text-ink-700">
          <div className="flex items-center justify-between">
            <span>
              {ev.locality}
            </span>
            <span className="text-ink-600">{ev.seatsLeft} left</span>
          </div>
          <div className="text-ink-600">
            {mounted ? (
              <>
                {dateLabel} • {timeLabel}
              </>
            ) : (
              <span className="invisible">Loading...</span>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {ev.cuisines && ev.cuisines.length > 0 && ev.cuisines.slice(0, 2).map((c, idx) => (
            <Badge key={c} tone={idx === 0 ? "violet" : "pink"}>{c}</Badge>
          ))}
          {ev.foodTags && ev.foodTags.length > 0 && ev.foodTags.slice(0, 2).map((t, idx) => (
            <Badge key={t} tone={idx === 0 ? "orange" : "sky"}>{t}</Badge>
          ))}
          {ev.activities && ev.activities.length > 0 && ev.activities.slice(0, 2).map((a, idx) => (
            <Badge key={a} tone={idx === 0 ? "pink" : "violet"}>{a}</Badge>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t-2 border-gradient-to-r from-violet-200 via-pink-200 to-orange-200 bg-gradient-to-r from-violet-50/50 via-pink-50/50 to-orange-50/50 pt-3 px-2 -mx-2 -mb-2 rounded-b-2xl sm:rounded-b-3xl">
          <span className="text-xs font-medium text-ink-700">Tap to view details & book</span>
          <span className="rounded-full border-2 border-violet-300 bg-gradient-to-r from-violet-100 to-pink-100 px-3 py-1 text-xs font-semibold text-violet-800 shadow-sm">
            {mounted ? dateLabel : "..."}
          </span>
        </div>
      </div>
    </Link>
  );
}

