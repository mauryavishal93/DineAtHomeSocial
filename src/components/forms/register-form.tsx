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
const GENDER_OPTIONS = ["Male", "Female", "Other"] as const;

const guestSchema = z.object({
  role: z.literal("GUEST"),
  firstName: z.string().min(1).max(40),
  lastName: z.string().min(1).max(40),
  age: z.coerce.number().int().min(0).max(99),
  gender: z.enum(GENDER_OPTIONS),
  email: z.string().email(),
  password: z.string().min(8),
  mobile: z.string().regex(/^\d{10}$/, "Mobile must be exactly 10 digits")
});

const hostSchema = z.object({
  role: z.literal("HOST"),
  email: z.string().email(),
  password: z.string().min(8),
  mobile: z.string().regex(/^\d{10}$/, "Mobile must be exactly 10 digits")
});

const schema = z.discriminatedUnion("role", [guestSchema, hostSchema]);

type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
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
    defaultValues: { role: "GUEST" }
  });

  const role = watch("role");

  const onSubmit = useMemo(
    () =>
      handleSubmit(async (values) => {
        setServerError(null);
        setServerOk(null);
        const res = await apiFetch<{ userId: string }>(
          "/api/auth/register",
          {
            method: "POST",
            body: JSON.stringify(values)
          }
        );
        if (!res.ok) {
          setServerError(res.error);
          return;
        }

        // Auto-login right after registration so the user can land on profile setup.
        const loginRes = await apiFetch<{
          accessToken: string;
          role: "ADMIN" | "HOST" | "GUEST";
        }>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: values.email, password: values.password })
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
    <form onSubmit={onSubmit} className="space-y-4">
      {serverError ? <Alert title="Registration failed" desc={serverError} /> : null}
      {serverOk ? <Alert title="Success" desc={serverOk} /> : null}

      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        {...register("email")}
        error={errors.email?.message}
      />

      {role === "GUEST" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="First name"
            placeholder="First name"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...register("firstName" as any)}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            error={(errors as any).firstName?.message as string | undefined}
          />
          <Input
            label="Last name"
            placeholder="Last name"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...register("lastName" as any)}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            error={(errors as any).lastName?.message as string | undefined}
          />
        </div>
      ) : null}

      {role === "GUEST" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Age"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...register("age" as any)}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            error={(errors as any).age?.message as string | undefined}
            defaultValue=""
          >
            <option value="" disabled>
              Select age
            </option>
            {AGE_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>

          <Select
            label="Gender"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...register("gender" as any)}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            error={(errors as any).gender?.message as string | undefined}
            defaultValue=""
          >
            <option value="" disabled>
              Select gender
            </option>
            {GENDER_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      <Input
        label="Mobile"
        placeholder="10-digit number"
        maxLength={10}
        inputMode="numeric"
        {...register("mobile")}
        error={errors.mobile?.message}
      />
      <Select
        label="Account type"
        {...register("role")}
        error={errors.role?.message}
      >
        <option value="GUEST">Guest</option>
        <option value="HOST">Host</option>
      </Select>
      <Input
        label="Password"
        type="password"
        placeholder="At least 8 characters"
        {...register("password")}
        error={errors.password?.message}
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create account"}
      </Button>
    </form>
  );
}

