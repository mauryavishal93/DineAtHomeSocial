"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/http";
import { getAccessToken, getRole } from "@/lib/session";

interface CalendarEvent {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  priceFrom: number;
  seatsLeft: number;
  city: string;
  locality: string;
  hostName: string;
}

export function EventCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await apiFetch<any[]>("/api/events");
        if (cancelled) return;
        if (res.ok && res.data) {
          setEvents(
            res.data.map((e) => ({
              id: e.id,
              title: e.title,
              startAt: e.startAt,
              endAt: e.endAt,
              priceFrom: e.priceFrom || 0,
              seatsLeft: e.seatsLeft || 0,
              city: e.city || "",
              locality: e.locality || "",
              hostName: e.hostName || "Host"
            }))
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load events:", error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mounted]);

  const [role, setRole] = useState<string | null>(null);
  const [todayStr, setTodayStr] = useState<string>("");

  useEffect(() => {
    if (!mounted) return;
    try {
      setRole(getRole());
    } catch (error) {
      // User not logged in - that's fine, we'll show calendar to everyone
      setRole(null);
    }
  }, [mounted]);

  useEffect(() => {
    if (mounted) {
      const today = new Date();
      setTodayStr(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
    }
  }, [mounted]);

  if (!mounted) {
    return null; // Don't render during SSR
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Array<{ date: number; fullDate: Date; hasEvents: boolean }> = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: 0, fullDate: new Date(year, month, 1), hasEvents: false });
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const fullDate = new Date(year, month, day);
      const dateStr = fullDate.toISOString().split("T")[0];
      const hasEvents = events.some((e) => {
        const eventDate = new Date(e.startAt).toISOString().split("T")[0];
        return eventDate === dateStr;
      });
      days.push({ date: day, fullDate, hasEvents });
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return events.filter((e) => {
      const eventDate = new Date(e.startAt).toISOString().split("T")[0];
      return eventDate === dateStr;
    });
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
    setSelectedDate(null);
  };

  const days = getDaysInMonth(currentMonth);
  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  if (loading) {
    return (
      <section className="mt-14 md:mt-20">
        <Container>
          <div className="text-center py-12">
            <div className="text-sm text-ink-600">Loading calendar...</div>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="mt-14 md:mt-20">
      <Container>
        <div className="mb-6">
          <div className="text-sm font-medium text-ink-700">Calendar</div>
          <h2 className="font-display text-3xl tracking-tight text-ink-900 mt-2">
            Event Calendar
          </h2>
          <p className="mt-2 text-sm text-ink-700">
            View all upcoming events in a calendar view
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          {/* Calendar */}
          <div className="rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-white via-pink-50/30 to-violet-50/30 p-6 shadow-colorful backdrop-blur">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigateMonth("prev")}
                className="p-2 hover:bg-violet-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="font-display text-xl font-bold text-ink-900">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </div>
              <button
                onClick={() => navigateMonth("next")}
                className="p-2 hover:bg-violet-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-ink-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                // Use a stable comparison that works on both server and client
                const dayStr = day.date !== 0 ? `${day.fullDate.getFullYear()}-${String(day.fullDate.getMonth() + 1).padStart(2, '0')}-${String(day.fullDate.getDate()).padStart(2, '0')}` : '';
                const isToday = day.date !== 0 && mounted && dayStr === todayStr;
                const isSelected =
                  day.date !== 0 &&
                  selectedDate &&
                  day.fullDate.toDateString() === selectedDate.toDateString();

                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (day.date !== 0) {
                        setSelectedDate(day.fullDate);
                      }
                    }}
                    className={`
                      aspect-square p-1 rounded-lg transition-all
                      ${day.date === 0 ? "cursor-default" : "cursor-pointer hover:bg-violet-100"}
                      ${isToday ? "bg-violet-200 font-bold" : ""}
                      ${isSelected ? "bg-violet-500 text-white" : ""}
                      ${day.hasEvents && !isSelected ? "bg-pink-100" : ""}
                    `}
                    disabled={day.date === 0}
                  >
                    <div className="text-sm">{day.date !== 0 ? day.date : ""}</div>
                    {day.hasEvents && day.date !== 0 && (
                      <div className="w-1 h-1 bg-violet-500 rounded-full mx-auto mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Events List */}
          <div className="space-y-4">
            <div className="rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-white via-pink-50/30 to-violet-50/30 p-6 shadow-colorful backdrop-blur">
              <div className="font-bold text-ink-900 mb-4">
                {selectedDate && mounted
                  ? selectedEvents.length > 0
                    ? `Events on ${new Intl.DateTimeFormat("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric"
                      }).format(selectedDate)}`
                    : `No events on ${new Intl.DateTimeFormat("en-US", {
                        month: "long",
                        day: "numeric"
                      }).format(selectedDate)}`
                  : "Select a date to view events"}
              </div>

              {selectedDate && selectedEvents.length > 0 && (
                <div className="space-y-3">
                  {selectedEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="block p-4 rounded-2xl border-2 border-violet-200 bg-white/60 hover:bg-violet-50 transition-all"
                    >
                      <div className="font-bold text-ink-900 mb-1">{event.title}</div>
                      <div className="text-sm text-ink-700 mb-2">
                        {new Date(event.startAt).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit"
                        })}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone="sky" className="text-xs">
                          📍 {event.locality || event.city}
                        </Badge>
                        <Badge tone="violet" className="text-xs">
                          👤 {event.hostName}
                        </Badge>
                        <Badge tone="success" className="text-xs">
                          ₹{Math.round(event.priceFrom)}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                  {role === "HOST" && (
                    <div className="pt-3 border-t border-violet-200">
                      <Button className="w-full" asChild>
                        <Link href={`/host/events/new?date=${selectedDate.toISOString().split('T')[0]}`}>
                          + Create Event on This Date
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {selectedDate && selectedEvents.length === 0 && (
                <div className="text-center py-8 text-ink-600">
                  <div className="text-sm">No events scheduled for this date</div>
                  {role === "HOST" ? (
                    <Button className="mt-4" asChild>
                      <Link href={`/host/events/new?date=${selectedDate.toISOString().split('T')[0]}`}>
                        Create Event
                      </Link>
                    </Button>
                  ) : (
                    <Button className="mt-4" asChild>
                      <Link href="/events">Browse all events</Link>
                    </Button>
                  )}
                </div>
              )}

              {!selectedDate && (
                <div className="text-center py-8 text-ink-600">
                  <div className="text-sm">Click on a date to see events</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
