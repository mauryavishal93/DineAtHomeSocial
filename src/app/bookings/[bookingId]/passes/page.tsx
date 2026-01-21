"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { EventPass } from "@/components/events/event-pass";
import { apiFetch } from "@/lib/http";
import { getAccessToken, getRole } from "@/lib/session";

type PassItem = {
  passId: string;
  eventCode: string;
  guestName: string;
  passType: "PRIMARY" | "ADDITIONAL";
  isValid: boolean;
  validatedAt: string | null;
};

export default function EventPassesPage({
  params
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const router = useRouter();
  const token = getAccessToken();
  const role = getRole();
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [passes, setPasses] = useState<PassItem[]>([]);
  const [selectedPass, setSelectedPass] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { bookingId: id } = await params;
      setBookingId(id);
    })();
  }, [params]);

  useEffect(() => {
    if (!token || !bookingId) return;
    if (role !== "GUEST") {
      router.push("/");
      return;
    }

    (async () => {
      setLoading(true);
      setError(null);
      const res = await apiFetch<{ passes: PassItem[] }>(
        `/api/bookings/${bookingId}/passes`,
        {
          method: "GET",
          headers: { authorization: `Bearer ${token}` }
        }
      );
      setLoading(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPasses(res.data.passes);
    })();
  }, [token, role, bookingId, router]);

  const handleViewPass = async (passId: string) => {
    const res = await apiFetch<any>(
      `/api/passes/${passId}`,
      {
        method: "GET",
        headers: { authorization: `Bearer ${token}` }
      }
    );
    if (res.ok && res.data) {
      setSelectedPass(res.data.pass);
    } else if (!res.ok) {
      alert(res.error || "Failed to load event pass");
    }
  };

  if (loading) {
    return (
      <main className="py-10">
        <Container>
          <div className="text-center text-ink-700">Loading event passes...</div>
        </Container>
      </main>
    );
  }

  if (error) {
    return (
      <main className="py-10">
        <Container>
          <div className="text-center text-red-600">Error: {error}</div>
        </Container>
      </main>
    );
  }

  return (
    <>
      <main className="py-10 min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
        <Container>
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-ink-900 mb-2">Your Event Passes</h1>
              <p className="text-ink-600">View and download your event passes</p>
            </div>

            {passes.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-violet-200">
                <p className="text-ink-600">No event passes found for this booking.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {passes.map((pass) => (
                  <div
                    key={pass.passId}
                    className="bg-white rounded-xl p-6 border-2 border-violet-200 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-ink-900">
                            {pass.guestName}
                          </h3>
                          {pass.passType === "PRIMARY" ? (
                            <span className="px-2 py-1 text-xs font-medium bg-violet-100 text-violet-700 rounded-full">
                              Primary Guest
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                              Additional Guest
                            </span>
                          )}
                          {pass.isValid ? (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                              Valid
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                              Used
                            </span>
                          )}
                        </div>
                        <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg p-3 inline-block">
                          <p className="text-xs text-white/80 mb-1 uppercase tracking-wider">Event Code</p>
                          <p className="text-xl font-bold text-white font-mono tracking-wider">{pass.eventCode}</p>
                        </div>
                        {pass.validatedAt && (
                          <p className="text-xs text-ink-500 mt-2">
                            Checked in: {new Date(pass.validatedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleViewPass(pass.passId)}
                        className="ml-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                      >
                        View Pass
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Container>
      </main>

      {selectedPass && (
        <EventPass
          pass={selectedPass}
          onClose={() => setSelectedPass(null)}
        />
      )}
    </>
  );
}
