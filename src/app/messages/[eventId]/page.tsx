import { Suspense } from "react";
import ChatEventRedirect from "./ChatEventRedirect";

export default function ChatEventPage({
  params
}: {
  params: Promise<{ eventId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="py-10">
          <div className="mx-auto max-w-lg flex flex-col items-center justify-center h-[40vh] text-ink-700">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600 mb-4" />
            <p>Loading…</p>
          </div>
        </main>
      }
    >
      <ChatEventRedirect params={params} />
    </Suspense>
  );
}
