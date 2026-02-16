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
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

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
        const res = await apiFetch<{ 
          accessToken: string; 
          role: "ADMIN" | "HOST" | "GUEST";
          profileComplete?: boolean;
          redirectTo?: string;
        }>(
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
        
        // Dispatch session change event
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("dah_session_change"));
        }
        
        // Redirect based on profile completeness
        const redirectPath = res.data.redirectTo || "/";
        setServerOk(`Logged in. Redirecting...`);
        setTimeout(() => {
          router.push(redirectPath);
        }, 100);
      }),
    [handleSubmit, router]
  );

  return (
    <div className="space-y-4">
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
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Signing in..." : "Login"}
        </Button>
      </form>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-sand-200"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-ink-500">Or continue with</span>
        </div>
      </div>

      <div className="space-y-2">
        <GoogleSignInButton 
          role="GUEST" 
          onError={(error) => setServerError(error)}
        />
        <GoogleSignInButton 
          role="HOST" 
          onError={(error) => setServerError(error)}
        />
      </div>
    </div>
  );
}

