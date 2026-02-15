"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

import { apiFetch } from "@/lib/http";
import { setSession } from "@/lib/session";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

// Dynamically import AddressMap to avoid SSR issues with Leaflet
const AddressMap = dynamic(() => import("@/components/map/address-map").then((mod) => mod.AddressMap), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 rounded-lg border border-sand-200 bg-sand-100 flex items-center justify-center text-sm text-ink-600">
      Loading map...
    </div>
  )
});

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
  mobile: z.string().regex(/^\d{10}$/, "Mobile must be exactly 10 digits"),
  password: z.string().min(8)
});

type FormValues = z.input<typeof schema>;

export function HostRegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverOk, setServerOk] = useState<string | null>(null);
  const router = useRouter();
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "HOST", age: 0 }
  });

  const address = watch("address");

  const handleLocationSelect = useMemo(
    () => (addr: string, lat: number, lng: number) => {
      setLatitude(lat);
      setLongitude(lng);
      // Update address if it changed
      if (addr && addr !== address) {
        setValue("address", addr);
      }
    },
    [address, setValue]
  );

  const onSubmit = useMemo(
    () =>
      handleSubmit(async (values) => {
        setServerError(null);
        setServerOk(null);

        // values are already validated/transformed by zodResolver
        const payload = values as z.output<typeof schema> & {
          latitude?: number | null;
          longitude?: number | null;
        };
        
        // Include coordinates if available
        if (latitude !== null && longitude !== null) {
          payload.latitude = latitude;
          payload.longitude = longitude;
        }
        
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
    [handleSubmit, router, latitude, longitude]
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <GoogleSignInButton
          role="HOST"
          variant="signup"
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

      {address && address.trim().length > 0 ? (
        <div className="rounded-lg border border-sand-200 overflow-hidden">
          <AddressMap
            address={address}
            latitude={latitude}
            longitude={longitude}
            onLocationSelect={handleLocationSelect}
            editable={true}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-sand-200 bg-sand-50 p-8 text-center text-sm text-ink-600">
          Enter a venue address above to see it on the map
        </div>
      )}

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
        placeholder="10-digit number"
        maxLength={10}
        inputMode="numeric"
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

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Creating..." : "Create Host account"}
      </Button>
      </form>
    </div>
  );
}

