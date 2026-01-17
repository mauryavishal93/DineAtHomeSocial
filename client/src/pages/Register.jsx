import { useState } from "react";
import { apiFetch } from "../lib/http.js";

export default function Register() {
  const [role, setRole] = useState("GUEST");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setOk("");
    const res = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, mobile, password, role })
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setOk("Registered. Now login.");
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-card backdrop-blur">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-900">
          Create account
        </h1>
        <p className="mt-2 text-sm text-ink-700">
          Create a Guest account, then complete your profile.
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
            <div className="text-sm font-medium text-ink-900">Account type</div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-sand-200 bg-white/70 px-4 py-3 text-sm outline-none focus:border-mint-300 focus:ring-2 focus:ring-mint-200"
            >
              <option value="GUEST">Guest</option>
              <option value="HOST">Host</option>
            </select>
          </label>
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
            <div className="text-sm font-medium text-ink-900">Mobile</div>
            <input
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-sand-200 bg-white/70 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-200"
              required
            />
          </label>
          <label className="block">
            <div className="text-sm font-medium text-ink-900">Password</div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="mt-2 w-full rounded-2xl border border-sand-200 bg-white/70 px-4 py-3 text-sm outline-none focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
              required
            />
          </label>
          <button
            className="shine w-full rounded-full bg-gradient-to-r from-coral-500 via-violet-500 to-sky-500 px-5 py-2.5 text-sm font-medium text-white shadow-soft hover:shadow-card"
            type="submit"
          >
            Create account
          </button>
        </form>
      </div>
    </div>
  );
}

