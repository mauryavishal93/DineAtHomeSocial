import { Suspense } from "react";
import MessagesClient from "./MessagesClient";

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <main className="flex h-[calc(100vh-80px)]">
          <div className="flex items-center justify-center w-full text-ink-700">
            <div className="text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600 mx-auto mb-4" />
              <p>Loading conversations...</p>
            </div>
          </div>
        </main>
      }
    >
      <MessagesClient />
    </Suspense>
  );
}
