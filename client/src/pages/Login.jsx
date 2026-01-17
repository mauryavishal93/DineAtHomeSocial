import { useState } from "react";
import { apiFetch } from "../lib/http.js";
import { setAccessToken } from "../lib/auth.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setOk("");
    const res = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setAccessToken(res.data?.accessToken || "");
    setOk("Logged in. Now go to Guest Profile.");
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-card backdrop-blur">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-900">Login</h1>
        <p className="mt-2 text-sm text-ink-700">
          Login stores the access token in localStorage (temporary for MVP).
        </p>
        {error ? (
          <div className="mt-5 rounded-2xl border border-coral-200 bg-coral-50/60 p-4 text-sm text-coral-900">
            {error}
          </div>
        ) : null}
        {ok ? (
          <div className="mt-5 rounded-2xl border border-mint-200 bg-mint-50/60 p-4 text-sm text-mint-900">
            {ok}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <div className="text-sm font-medium text-ink-900">Email</div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="mt-2 w-full rounded-2xl border border-sand-200 bg-white/70 px-4 py-3 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-200"
              required
            />
          </label>
          <label className="block">
            <div className="text-sm font-medium text-ink-900">Password</div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="mt-2 w-full rounded-2xl border border-sand-200 bg-white/70 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-200"
              required
            />
          </label>
          <button
            className="shine w-full rounded-full bg-gradient-to-r from-coral-500 via-violet-500 to-sky-500 px-5 py-2.5 text-sm font-medium text-white shadow-soft hover:shadow-card"
            type="submit"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

