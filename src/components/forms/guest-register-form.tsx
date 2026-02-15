"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

import { apiFetch } from "@/lib/http";
import { setSession } from "@/lib/session";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

const AGE_OPTIONS = Array.from({ length: 100 }, (_, i) => i);
const GENDER_OPTIONS = ["Male", "Female", "Other"] as const;

const listFromCsv = z.union([z.array(z.string()), z.string()]).transform((v) => {
  if (Array.isArray(v)) return v.map((s) => s.trim()).filter(Boolean);
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
});

const schema = z.object({
  role: z.literal("GUEST"),
  firstName: z.string().min(1).max(40),
  lastName: z.string().min(1).max(40),
  age: z.coerce.number().int().min(0).max(99),
  gender: z.enum(GENDER_OPTIONS),
  email: z.string().email(),
  mobile: z.string().min(8).max(20),
  password: z.string().min(8),
  interests: listFromCsv.optional()
});

type FormValues = z.input<typeof schema>;

export function GuestRegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverOk, setServerOk] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "GUEST", age: 0, gender: "Male" }
  });

  const onSubmit = useMemo(
    () =>
      handleSubmit(async (values) => {
        setServerError(null);
        setServerOk(null);

        // values are already validated/transformed by zodResolver
        const payload = values as z.output<typeof schema>;
        const res = await apiFetch<{ userId: string }>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          setServerError(res.error);
          return;
        }

        const loginRes = await apiFetch<{
          accessToken: string;
          role: "ADMIN" | "HOST" | "GUEST";
        }>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: payload.email, password: payload.password })
        });
        if (!loginRes.ok) {
          setServerOk("Account created. Redirecting to login…");
          router.push("/auth/login");
          return;
        }

        setSession({ accessToken: loginRes.data.accessToken, role: loginRes.data.role });
        setServerOk("Account created. Redirecting to profile…");
        router.push("/profile");
      }),
    [handleSubmit, router]
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <GoogleSignInButton 
          role="GUEST" 
          onError={(error) => setServerError(error)}
        />
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-sand-200"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-ink-500">Or create account with email</span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {serverError ? <Alert title="Registration failed" desc={serverError} /> : null}
        {serverOk ? <Alert title="Success" desc={serverOk} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="First name"
          {...register("firstName")}
          error={errors.firstName?.message}
        />
        <Input
          label="Last name"
          {...register("lastName")}
          error={errors.lastName?.message}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Age" {...register("age")} error={errors.age?.message}>
          {AGE_OPTIONS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </Select>
        <Select label="Gender" {...register("gender")} error={errors.gender?.message}>
          {GENDER_OPTIONS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </Select>
      </div>

      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        {...register("email")}
        error={errors.email?.message}
      />
      <Input
        label="Mobile"
        placeholder="+91..."
        {...register("mobile")}
        error={errors.mobile?.message}
      />
      <Input
        label="Interests (optional)"
        placeholder="Comma separated (e.g. music, travel)"
        {...register("interests")}
        error={errors.interests?.message}
      />
      <Input
        label="Password"
        type="password"
        placeholder="At least 8 characters"
        {...register("password")}
        error={errors.password?.message}
      />

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Creating..." : "Create Guest account"}
      </Button>
      </form>
    </div>
  );
}

