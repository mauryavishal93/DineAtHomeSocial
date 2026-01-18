"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/http";
import { setSession, getAccessToken } from "@/lib/session";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await apiFetch<{
      accessToken: string;
      admin: {
        id: string;
        username: string;
        role: string;
        fullName: string;
      };
    }>("/api/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });

    if (res.ok) {
      // Debug: Log the response data
      console.log("Login response data:", res.data);
      
      if (!res.data.accessToken) {
        setError("Login failed: No access token received");
        console.error("No accessToken in response:", res.data);
        return;
      }
      
      setSession({
        accessToken: res.data.accessToken,
        role: "ADMIN"
      });
      
      // Verify token was stored
      const storedToken = getAccessToken();
      if (!storedToken) {
        setError("Failed to store authentication token");
        console.error("Token not stored in localStorage");
        return;
      }
      
      console.log("Token stored successfully, redirecting...");
      router.push("/admin");
    } else {
      setError(res.error || "Invalid credentials");
    }
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center py-10">
      <Container>
        <div className="mx-auto max-w-md">
          <div className="rounded-3xl border border-sand-200 bg-white/60 p-8 shadow-soft backdrop-blur">
            <h1 className="font-display text-3xl tracking-tight text-ink-900">
              Admin Login
            </h1>
            <p className="mt-2 text-sm text-ink-700">
              Enter your admin credentials to access the control panel
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Input
                label="Username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
              )}

              <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>

            <div className="mt-6 rounded-lg bg-sand-50 p-4 text-xs text-ink-600">
              <p className="font-medium text-ink-900">Default Admin Accounts:</p>
              <ul className="mt-2 space-y-1">
                <li>superadmin / SuperAdmin@2024!</li>
                <li>moderator / Moderator@2024!</li>
                <li>analyst / Analyst@2024!</li>
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
