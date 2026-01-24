"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { apiFetch } from "@/lib/http";

interface Testimonial {
  id: string;
  guestName: string;
  hostName: string;
  eventName: string;
  rating: number;
  eventRating: number;
  venueRating: number;
  foodRating: number;
  hospitalityRating: number;
  comment: string;
  helpfulCount: number;
  createdAt: string;
}

export function TestimonialsSection() {
  const [mounted, setMounted] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch<Testimonial[]>("/api/reviews/featured");
        if (res.ok && res.data) {
          setTestimonials(res.data);
        }
      } catch (error) {
        console.error("Failed to load testimonials:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <section className="mt-14 md:mt-20">
        <Container>
          <div className="text-center py-12">
            <div className="text-sm text-ink-600">Loading testimonials...</div>
          </div>
        </Container>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return null;
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={i < rating ? "text-yellow-400" : "text-sand-300"}>
        ★
      </span>
    ));
  };

  return (
    <section className="mt-14 md:mt-20">
      <Container>
        <div className="text-center mb-8">
          <div className="text-sm font-medium text-ink-700">Testimonials</div>
          <h2 className="font-display text-3xl tracking-tight text-ink-900 mt-2">
            What our guests say
          </h2>
          <p className="mt-2 text-sm text-ink-700">
            Real experiences from real diners
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-white via-pink-50/30 to-violet-50/30 p-6 shadow-colorful backdrop-blur transition-all duration-300 hover:scale-[1.02] hover:shadow-glow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="font-bold text-ink-900">{testimonial.guestName}</div>
                  <div className="text-xs text-ink-600 mt-1">
                    reviewed {testimonial.hostName}
                  </div>
                </div>
                <div className="text-xs text-yellow-400">
                  {renderStars(testimonial.rating)}
                </div>
              </div>

              <div className="mb-3">
                <div className="text-sm font-medium text-ink-700 mb-2">
                  {testimonial.eventName}
                </div>
                <p className="text-sm text-ink-700 line-clamp-3">{testimonial.comment}</p>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {testimonial.foodRating > 0 && (
                  <Badge tone="mint" className="text-xs">
                    Food: {testimonial.foodRating.toFixed(1)}/5
                  </Badge>
                )}
                {testimonial.venueRating > 0 && (
                  <Badge tone="sky" className="text-xs">
                    Venue: {testimonial.venueRating.toFixed(1)}/5
                  </Badge>
                )}
                {testimonial.hospitalityRating > 0 && (
                  <Badge tone="violet" className="text-xs">
                    Hospitality: {testimonial.hospitalityRating.toFixed(1)}/5
                  </Badge>
                )}
              </div>

              <div className="text-xs text-ink-500">
                {mounted ? new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                }).format(new Date(testimonial.createdAt)) : ""}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
