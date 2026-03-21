"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/http";
import { getAccessToken, getRole } from "@/lib/session";

export default function ChatEventRedirect({
  params
}: {
  params: Promise<{ eventId: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = getAccessToken();
  const role = getRole();
  const [eventId, setEventId] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "redirect" | "needBooking" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    params.then((p) => setEventId(p.eventId));
  }, [params]);

  useEffect(() => {
    if (!eventId || !token) {
      if (eventId && !token) setStatus("error");
      return;
    }

    const bookingFromQuery = searchParams.get("bookingId");
    if (bookingFromQuery) {
      setStatus("redirect");
      router.replace(
        `/messages?eventId=${encodeURIComponent(eventId)}&bookingId=${encodeURIComponent(bookingFromQuery)}`
      );
      return;
    }

    if (role === "HOST") {
      setStatus("needBooking");
      return;
    }

    if (role === "GUEST") {
      (async () => {
        const res = await apiFetch<{ bookingId: string }>(`/api/events/${eventId}/my-booking`, {
          headers: { authorization: `Bearer ${token}` }
        });
        if (res.ok && res.data?.bookingId) {
          setStatus("redirect");
          router.replace(
            `/messages?eventId=${encodeURIComponent(eventId)}&bookingId=${encodeURIComponent(res.data.bookingId)}`
          );
        } else {
          setErrorMsg(res.ok ? "No active booking for this event." : res.error);
          setStatus("error");
        }
      })();
      return;
    }

    setStatus("error");
    setErrorMsg("Open Messages from your dashboard.");
  }, [eventId, token, role, searchParams, router]);

  if (!token) {
    return (
      <main className="py-10">
        <Container className="max-w-lg text-center">
          <p className="text-ink-700 mb-4">Please log in to view messages.</p>
          <Button asChild>
            <Link href="/auth/login">Login</Link>
          </Button>
        </Container>
      </main>
    );
  }

  if (status === "loading" || status === "redirect") {
    return (
      <main className="py-10">
        <Container>
          <div className="flex flex-col items-center justify-center h-[50vh] text-ink-700">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600 mb-4" />
            <p>{status === "redirect" ? "Opening private chat…" : "Loading…"}</p>
          </div>
        </Container>
      </main>
    );
  }

  if (status === "needBooking") {
    return (
      <main className="py-10">
        <Container className="max-w-lg">
          <h1 className="font-display text-xl font-semibold text-ink-900 mb-2">Host chat</h1>
          <p className="text-sm text-ink-700 mb-4">
            Choose a specific guest thread from <strong>Messages</strong> (each booking has its own private,
            encrypted chat).
          </p>
          <Button asChild>
            <Link href="/messages">Open Messages</Link>
          </Button>
        </Container>
      </main>
    );
  }

  return (
    <main className="py-10">
      <Container className="max-w-lg text-center">
        <p className="text-ink-700 mb-4">{errorMsg}</p>
        <Button asChild variant="outline">
          <Link href="/messages">Back to Messages</Link>
        </Button>
      </Container>
    </main>
  );
}
