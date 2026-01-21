"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/http";
import { getAccessToken, getRole } from "@/lib/session";

type CalendarEvent = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  seatsLeft: number;
  maxGuests: number;
  bookingsCount: number;
  status: string;
};

export default function HostCalendarPage() {
  const router = useRouter();
  const token = getAccessToken();
  const role = getRole();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    if (!token) {
      router.push("/auth/login");
      return;
    }
    if (role !== "HOST") {
      router.push("/");
      return;
    }

    loadEvents();
  }, [token, role, router, currentMonth]);

  useEffect(() => {
    if (selectedDate) {
      const dayEvents = events.filter((e) => {
        const eventDate = new Date(e.startAt);
        return (
          eventDate.getDate() === selectedDate.getDate() &&
          eventDate.getMonth() === selectedDate.getMonth() &&
          eventDate.getFullYear() === selectedDate.getFullYear()
        );
      });
      setSelectedEvents(dayEvents);
    }
  }, [selectedDate, events]);

  const loadEvents = async () => {
    if (!token) return;
    
    const res = await apiFetch<{ upcoming: CalendarEvent[]; past: CalendarEvent[] }>(
      "/api/host/my-events",
      {
        headers: { authorization: `Bearer ${token}` }
      }
    );
    
    if (res.ok && res.data) {
      // Combine upcoming and past events for calendar view
      setEvents([...res.data.upcoming, ...res.data.past]);
    }
    setLoading(false);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    return events.filter((e) => {
      const eventDate = new Date(e.startAt);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

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
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (loading) {
    return (
      <main className="py-10">
        <Container>
          <div className="text-center text-ink-700">Loading calendar...</div>
        </Container>
      </main>
    );
  }

  const days = getDaysInMonth(currentMonth);

  return (
    <main className="py-10">
      <Container>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl tracking-tight bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
              Event Calendar
            </h1>
            <p className="mt-2 text-ink-700">View and manage your events by date</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigateMonth("prev")}>
              ← Previous
            </Button>
            <Button variant="outline" onClick={() => setCurrentMonth(new Date())}>
              Today
            </Button>
            <Button variant="outline" onClick={() => navigateMonth("next")}>
              Next →
            </Button>
            <Button asChild>
              <Link href="/host/events/new">Create Event</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* Calendar Grid */}
          <div className="rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-white via-pink-50/30 to-violet-50/30 p-6 shadow-colorful">
            <div className="mb-6 text-center">
              <h2 className="font-display text-2xl text-ink-900">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h2>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {dayNames.map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-ink-600 py-2">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {days.map((date, idx) => {
                if (!date) {
                  return <div key={`empty-${idx}`} className="aspect-square" />;
                }

                const dayEvents = getEventsForDate(date);
                const isToday =
                  date.getDate() === new Date().getDate() &&
                  date.getMonth() === new Date().getMonth() &&
                  date.getFullYear() === new Date().getFullYear();
                const isSelected =
                  selectedDate &&
                  date.getDate() === selectedDate.getDate() &&
                  date.getMonth() === selectedDate.getMonth() &&
                  date.getFullYear() === selectedDate.getFullYear();

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={`aspect-square rounded-xl border-2 p-2 text-left transition-all duration-200 hover:scale-105 ${
                      isSelected
                        ? "border-violet-500 bg-gradient-to-br from-violet-100 to-pink-100 shadow-lg"
                        : isToday
                        ? "border-orange-300 bg-gradient-to-br from-orange-50 to-yellow-50"
                        : "border-violet-200 bg-white hover:border-violet-300"
                    }`}
                  >
                    <div className={`text-sm font-semibold ${isToday ? "text-orange-600" : "text-ink-900"}`}>
                      {date.getDate()}
                    </div>
                    {dayEvents.length > 0 && (
                      <div className="mt-1 space-y-1">
                        {dayEvents.slice(0, 2).map((e) => (
                          <div
                            key={e.id}
                            className="text-xs rounded px-1 py-0.5 bg-violet-200 text-violet-800 truncate"
                            title={e.title}
                          >
                            {e.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-ink-600">+{dayEvents.length - 2} more</div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Events */}
          <div className="rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-white via-orange-50/30 to-yellow-50/30 p-6 shadow-colorful">
            <h2 className="font-display text-xl text-ink-900 mb-4">
              {selectedDate
                ? `${selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`
                : "Select a date"}
            </h2>

            {selectedDate && selectedEvents.length === 0 ? (
              <div className="text-center text-ink-600 py-8">
                <p>No events scheduled for this date</p>
                <Button className="mt-4" variant="outline" asChild>
                  <Link href="/host/events/new">Create Event</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border-2 border-violet-200 bg-white p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-display text-lg text-ink-900">{event.title}</h3>
                      <Badge tone={event.status === "OPEN" ? "success" : "ink"}>
                        {event.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-ink-700 space-y-1">
                      <div>🕐 {new Date(event.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                      <div>👥 {event.bookingsCount} bookings • {event.seatsLeft} seats left</div>
                    </div>
                    <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                      <Link href={`/host/my-events`}>View Details</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>
    </main>
  );
}
