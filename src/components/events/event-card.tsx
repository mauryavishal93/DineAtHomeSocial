"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

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
  hostRating: number;
  verified: boolean;
  foodTags: string[];
  cuisines?: string[];
  foodType?: string;
  activities?: string[];
  eventImages?: Array<{ filePath: string; fileMime: string; fileName: string; uploadedAt?: Date }>;
  eventVideos?: Array<{ filePath: string; fileMime: string; fileName: string; uploadedAt?: Date }>;
};

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(undefined, { weekday: "short", day: "2-digit", month: "short" }).format(d);
}

function formatTimeLabel(startIso: string, endIso: string) {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const tf = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
  return `${tf.format(s)} – ${tf.format(e)}`;
}

export function EventCard({ ev }: { ev: UIEvent }) {
  const dateLabel = formatDateLabel(ev.startAt);
  const timeLabel = formatTimeLabel(ev.startAt, ev.endAt);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

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
      className="group overflow-hidden rounded-2xl border border-sand-200 bg-white/60 shadow-soft backdrop-blur transition hover:-translate-y-0.5 hover:shadow-card"
    >
      <div className="relative">
        <div className="relative h-44 overflow-hidden">
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
          <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 rounded-full border border-sand-200 bg-white/70 px-2.5 py-1 text-xs text-ink-700">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-ink-900 text-sand-50">
              {ev.hostName.slice(0, 1).toUpperCase()}
            </span>
            <span className="font-medium text-ink-900">{ev.hostName}</span>
            <span className="text-ink-600">• {ev.hostRating.toFixed(1)}</span>
          </div>
        </div>
        <div className="absolute left-4 top-4 z-20 flex gap-2">
          {ev.verified ? <Badge tone="success">ID verified</Badge> : <Badge>New host</Badge>}
          {ev.seatsLeft <= 3 ? <Badge tone="warning">Few seats</Badge> : null}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-display text-lg leading-tight text-ink-900">
              {ev.title}
            </div>
            <div className="mt-1 text-sm text-ink-700">{ev.venueName}</div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-sm font-semibold text-ink-900">₹{ev.priceFrom}</div>
            <div className="text-xs text-ink-600">from / guest</div>
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
            {dateLabel} • {timeLabel}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {ev.cuisines && ev.cuisines.length > 0 && ev.cuisines.slice(0, 2).map((c) => (
            <Badge key={c}>{c}</Badge>
          ))}
          {ev.foodTags && ev.foodTags.length > 0 && ev.foodTags.slice(0, 2).map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
          {ev.activities && ev.activities.length > 0 && ev.activities.slice(0, 2).map((a) => (
            <Badge key={a}>{a}</Badge>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-sand-200 pt-3 text-xs text-ink-600">
          <span>Tap to view details & book</span>
          <span className="rounded-full border border-sand-200 bg-sand-50/70 px-2 py-1">
            {dateLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}

