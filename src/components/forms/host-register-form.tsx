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

const AGE_OPTIONS = Array.from({ length: 100 }, (_, i) => i);

const listFromCsv = z.union([z.array(z.string()), z.string()]).transform((v) => {
  if (Array.isArray(v)) return v.map((s) => s.trim()).filter(Boolean);
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
});

const schema = z.object({
  role: z.literal("HOST"),
  firstName: z.string().min(1).max(40),
  lastName: z.string().min(1).max(40),
  age: z.coerce.number().int().min(0).max(99),
  venueName: z.string().min(1).max(120),
  address: z.string().min(1).max(240),
  interests: listFromCsv.optional(),
  cuisines: listFromCsv,
  activities: listFromCsv,
  email: z.string().email(),
  mobile: z.string().min(8).max(20),
  password: z.string().min(8)
});

type FormValues = z.input<typeof schema>;

export function HostRegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverOk, setServerOk] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "HOST", age: 0 }
  });

  const address = watch("address");

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

  const mapSrc = useMemo(() => {
    const q = encodeURIComponent(address || "");
    if (!q) return null;
    return `https://www.google.com/maps?q=${q}&output=embed`;
  }, [address]);

  return (
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

      <Select label="Age" {...register("age")} error={errors.age?.message}>
        {AGE_OPTIONS.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </Select>

      <Input
        label="Venue name"
        placeholder="e.g. Vishal’s Home Kitchen"
        {...register("venueName")}
        error={errors.venueName?.message}
      />

      <Input
        label="Venue address"
        placeholder="Street, locality, city"
        {...register("address")}
        error={errors.address?.message}
      />

      {mapSrc ? (
        <div className="overflow-hidden rounded-2xl border border-sand-200 bg-white/60">
          <iframe
            title="Map preview"
            src={mapSrc}
            className="h-56 w-full"
            loading="lazy"
          />
        </div>
      ) : null}

      <Input
        label="Interests (optional)"
        placeholder="Comma separated (e.g. music, travel)"
        {...register("interests")}
        error={errors.interests?.message}
      />

      <Input
        label="Cuisine served"
        placeholder="Comma separated (e.g. North Indian, Chinese)"
        {...register("cuisines")}
        error={errors.cuisines?.message}
      />

      <Input
        label="Activities available at venue"
        placeholder="Comma separated (e.g. Carrom, Cards, TV, Music, Video games)"
        {...register("activities")}
        error={errors.activities?.message}
      />

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
        label="Password"
        type="password"
        placeholder="At least 8 characters"
        {...register("password")}
        error={errors.password?.message}
      />

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Host account"}
      </Button>
    </form>
  );
}

