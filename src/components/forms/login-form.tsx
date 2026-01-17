"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { apiFetch } from "@/lib/http";
import { setSession } from "@/lib/session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverOk, setServerOk] = useState<string | null>(null);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = useMemo(
    () =>
      handleSubmit(async (values) => {
        setServerError(null);
        setServerOk(null);
        const res = await apiFetch<{ accessToken: string; role: "ADMIN" | "HOST" | "GUEST" }>(
          "/api/auth/login",
          {
            method: "POST",
            body: JSON.stringify(values)
          }
        );
        if (!res.ok) {
          setServerError(res.error);
          return;
        }
        setSession({ accessToken: res.data.accessToken, role: res.data.role });
        setServerOk("Logged in. Redirecting to home…");
        router.push("/");
      }),
    [handleSubmit, router]
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {serverError ? <Alert title="Login failed" desc={serverError} /> : null}
      {serverOk ? <Alert title="Success" desc={serverOk} /> : null}
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        {...register("email")}
        error={errors.email?.message}
      />
      <Input
        label="Password"
        type="password"
        {...register("password")}
        error={errors.password?.message}
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Login"}
      </Button>
    </form>
  );
}

