import { Suspense } from "react";
import HostCreateEventClient from "./host-create-event-client";

export default function HostCreateEventPage() {
  return (
    <Suspense
      fallback={
        <main className="py-10">
          <div className="mx-auto max-w-2xl px-4 text-sm text-ink-700">Loading…</div>
        </main>
      }
    >
      <HostCreateEventClient />
    </Suspense>
  );
}

