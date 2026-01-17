import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/http.js";

export default function GuestProfile() {
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState("");
  const [serverOk, setServerOk] = useState("");

  const [name, setName] = useState("");
  const [age, setAge] = useState(18);
  const [gender, setGender] = useState("Prefer not to say");
  const [interestsText, setInterestsText] = useState("Board games, Music");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setServerError("");
      const res = await apiFetch("/api/guest/profile");
      if (!mounted) return;
      if (!res.ok) {
        setServerError(res.error);
        setLoading(false);
        return;
      }
      const p = res.data || {};
      setName(p.name || "");
      setAge(p.age || 18);
      setGender(p.gender || "Prefer not to say");
      setInterestsText((p.interests || []).join(", "));
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const interests = useMemo(
    () =>
      interestsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 20),
    [interestsText]
  );

  async function onSubmit(e) {
    e.preventDefault();
    setServerError("");
    setServerOk("");
    const res = await apiFetch("/api/guest/profile", {
      method: "PUT",
      body: JSON.stringify({ name, age, gender, interests })
    });
    if (!res.ok) {
      setServerError(res.error);
      return;
    }
    setServerOk("Profile saved.");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="relative overflow-hidden rounded-3xl border border-sand-200 bg-white/60 p-8 shadow-card backdrop-blur">
        <div className="pointer-events-none absolute -left-20 -top-16 h-52 w-52 rounded-full bg-violet-300/30 blur-3xl animate-blob" />
        <div className="pointer-events-none absolute -right-16 -bottom-20 h-60 w-60 rounded-full bg-coral-300/25 blur-3xl animate-blob" />

        <div className="relative">
          <div className="text-sm font-medium text-ink-700">Guest profile</div>
          <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight text-ink-900">
            Tell us about you
          </h1>
          <p className="mt-2 text-sm text-ink-700">
            We use this to improve matching (food + interests) and build trust.
          </p>

          {serverError ? (
            <div className="mt-6 rounded-2xl border border-coral-200 bg-coral-50/60 p-4 text-sm text-coral-900">
              {serverError} (Make sure you’re logged in and sending a Bearer token.)
            </div>
          ) : null}
          {serverOk ? (
            <div className="mt-6 rounded-2xl border border-mint-200 bg-mint-50/60 p-4 text-sm text-mint-900">
              {serverOk}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mt-8 grid gap-5 md:grid-cols-2">
            <label className="block md:col-span-2">
              <div className="text-sm font-medium text-ink-900">Name</div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aanya Sharma"
                className="mt-2 w-full rounded-2xl border border-sand-200 bg-white/70 px-4 py-3 text-sm text-ink-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-200"
                required
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium text-ink-900">Age</div>
              <input
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                type="number"
                min={13}
                max={120}
                className="mt-2 w-full rounded-2xl border border-sand-200 bg-white/70 px-4 py-3 text-sm text-ink-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-200"
                required
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium text-ink-900">Gender</div>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-sand-200 bg-white/70 px-4 py-3 text-sm text-ink-900 outline-none focus:border-mint-300 focus:ring-2 focus:ring-mint-200"
              >
                <option>Female</option>
                <option>Male</option>
                <option>Non-binary</option>
                <option>Prefer not to say</option>
              </select>
            </label>

            <label className="block md:col-span-2">
              <div className="text-sm font-medium text-ink-900">
                Interests <span className="text-xs font-normal text-ink-600">(comma separated)</span>
              </div>
              <input
                value={interestsText}
                onChange={(e) => setInterestsText(e.target.value)}
                placeholder="e.g. Board games, Music, Travel, Networking"
                className="mt-2 w-full rounded-2xl border border-sand-200 bg-white/70 px-4 py-3 text-sm text-ink-900 outline-none focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
              />
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {interests.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-sand-200 bg-sand-50/70 px-2.5 py-1 text-ink-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </label>

            <div className="md:col-span-2 flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="shine rounded-full bg-gradient-to-r from-coral-500 via-violet-500 to-sky-500 px-5 py-2.5 text-sm font-medium text-white shadow-soft hover:shadow-card"
              >
                {loading ? "Loading..." : "Save profile"}
              </button>
              <a
                href="/events"
                className="rounded-full border border-ink-200 bg-white/60 px-5 py-2.5 text-sm text-ink-900 hover:bg-white"
              >
                Explore events
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

