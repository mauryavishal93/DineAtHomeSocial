"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import { apiFetch } from "@/lib/http";
import { getAccessToken, getRole } from "@/lib/session";

const guestSchema = z.object({
  name: z.string().min(1).max(80),
  age: z.coerce.number().int().min(0).max(99),
  gender: z.enum(["Male", "Female", "Other"]),
  bio: z.string().max(1000).optional(),
  interests: z
    .union([z.array(z.string()), z.string()])
    .default("")
    .transform((v) => {
      if (Array.isArray(v)) return v.map((s) => s.trim()).filter(Boolean);
      return v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    })
});
type GuestFormValues = z.input<typeof guestSchema>;

const AGE_OPTIONS = Array.from({ length: 100 }, (_, i) => i);
const GENDER_OPTIONS = ["Male", "Female", "Other"] as const;

const hostSchema = z.object({
  firstName: z.string().min(1).max(40),
  lastName: z.string().min(1).max(40),
  age: z.coerce.number().int().min(0).max(99),
  bio: z.string().max(1000).optional(),
  interests: z
    .union([z.array(z.string()), z.string()])
    .default("")
    .transform((v) => {
      if (Array.isArray(v)) return v.map((s) => s.trim()).filter(Boolean);
      return v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }),
  venueName: z.string().min(1).max(120),
  venueAddress: z.string().min(1).max(240),
  locality: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  cuisines: z
    .union([z.array(z.string()), z.string()])
    .default("")
    .transform((v) => {
      if (Array.isArray(v)) return v.map((s) => s.trim()).filter(Boolean);
      return v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }),
  activities: z
    .union([z.array(z.string()), z.string()])
    .default("")
    .transform((v) => {
      if (Array.isArray(v)) return v.map((s) => s.trim()).filter(Boolean);
      return v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    })
});
type HostFormValues = z.input<typeof hostSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [venueImages, setVenueImages] = useState<Array<{ filePath: string; fileMime: string; fileName: string; uploadedAt: Date }>>([]);
  const [uploadingVenueImages, setUploadingVenueImages] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [locality, setLocality] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [state, setState] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [postalCode, setPostalCode] = useState<string>("");
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [guestOverview, setGuestOverview] = useState<{
    attendedEvents: Array<{
      bookingId: string;
      eventSlotId: string;
      eventName: string;
      startAt: string | null;
      venueName: string;
      venueLocality: string;
      seats: number;
      amountTotal: number;
    }>;
    feedbackGiven: Array<{
      feedbackId: string;
      eventName: string;
      toUserName: string;
      rating: number;
      comment: string;
      createdAt: string | null;
    }>;
  } | null>(null);

  const guestForm = useForm<GuestFormValues>({
    resolver: zodResolver(guestSchema),
    defaultValues: { name: "", age: 0, gender: "Male", bio: "", interests: "" }
  });

  const hostForm = useForm<HostFormValues>({
    resolver: zodResolver(hostSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      age: 0,
      bio: "",
      interests: "",
      venueName: "",
      venueAddress: "",
      locality: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      cuisines: "",
      activities: ""
    }
  });

  // Only access localStorage after component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
    setToken(getAccessToken());
    setRole(getRole());
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    if (!token) {
      router.push("/auth/login");
      return;
    }
    if (!role) {
      router.push("/");
      return;
    }

    (async () => {
      setServerError(null);
      setSavedMsg(null);
      setLoading(true);

      if (role === "GUEST") {
        const res = await apiFetch<{
          profile: { name: string; age: number; gender: string; bio?: string; interests: string[] };
          attendedEvents: Array<{
            bookingId: string;
            eventSlotId: string;
            eventName: string;
            startAt: string | null;
            venueName: string;
            venueLocality: string;
            seats: number;
            amountTotal: number;
          }>;
          feedbackGiven: Array<{
            feedbackId: string;
            eventName: string;
            toUserName: string;
            rating: number;
            comment: string;
            createdAt: string | null;
          }>;
        }>("/api/guest/account", {
          method: "GET",
          headers: { authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          setServerError(res.error);
          setLoading(false);
          return;
        }
        guestForm.reset({
          name: res.data.profile?.name ?? "",
          age: res.data.profile?.age ?? 0,
          gender: (res.data.profile?.gender as "Male" | "Female" | "Other") ?? "Male",
          bio: res.data.profile?.bio ?? "",
          interests: (res.data.profile?.interests ?? []).join(", ")
        });
        setGuestOverview({
          attendedEvents: res.data.attendedEvents ?? [],
          feedbackGiven: res.data.feedbackGiven ?? []
        });
        setLoading(false);
        return;
      }

      if (role === "HOST") {
        const res = await apiFetch<{
          firstName: string;
          lastName: string;
          age: number;
          bio?: string;
          interests: string[];
          name: string;
          venueName: string;
          venueAddress: string;
          locality?: string;
          city?: string;
          state?: string;
          country?: string;
          postalCode?: string;
          cuisines: string[];
          activities: string[];
          latitude?: number | null;
          longitude?: number | null;
          venueImages?: Array<{ filePath: string; fileMime: string; fileName: string; uploadedAt: Date }>;
        }>("/api/host/profile", {
          method: "GET",
          headers: { authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          setServerError(res.error);
          setLoading(false);
          return;
        }
        hostForm.reset({
          firstName: res.data.firstName ?? "",
          lastName: res.data.lastName ?? "",
          age: res.data.age ?? 0,
          bio: res.data.bio ?? "",
          interests: (res.data.interests ?? []).join(", "),
          venueName: res.data.venueName ?? "",
          venueAddress: res.data.venueAddress ?? "",
          locality: res.data.locality ?? "",
          city: res.data.city ?? "",
          state: res.data.state ?? "",
          country: res.data.country ?? "",
          postalCode: res.data.postalCode ?? "",
          cuisines: (res.data.cuisines ?? []).join(", "),
          activities: (res.data.activities ?? []).join(", ")
        });
        setLocality(res.data.locality ?? "");
        setCity(res.data.city ?? "");
        setState(res.data.state ?? "");
        setCountry(res.data.country ?? "");
        setPostalCode(res.data.postalCode ?? "");
        setVenueImages(res.data.venueImages ?? []);
        setGuestOverview(null);
        setLoading(false);
        return;
      }

      // ADMIN: no profile yet
      setGuestOverview(null);
      setLoading(false);
    })();
  }, [guestForm, hostForm, role, router, token, mounted]);

  // Auto-fill address components when venue address changes
  useEffect(() => {
    if (!mounted || !isEditing || role !== "HOST") return;
    
    const address = hostForm.watch("venueAddress");
    if (!address || address.trim().length < 10) return;

    // Debounce auto-fill
    const timeoutId = setTimeout(async () => {
      setIsAutoFilling(true);
      try {
        const res = await apiFetch<{
          locality?: string;
          city?: string;
          state?: string;
          country?: string;
          postalCode?: string;
        }>(`/api/geocode?address=${encodeURIComponent(address.trim())}`);
        
        if (res.ok && res.data) {
          // Only auto-fill if fields are empty (don't overwrite user input)
          if (res.data.locality && !locality) setLocality(res.data.locality);
          if (res.data.city && !city) setCity(res.data.city);
          if (res.data.state && !state) setState(res.data.state);
          if (res.data.country && !country) setCountry(res.data.country);
          if (res.data.postalCode && !postalCode) setPostalCode(res.data.postalCode);
        }
      } catch (error) {
        // Silently fail - user can fill manually
        console.error("Auto-fill failed:", error);
      } finally {
        setIsAutoFilling(false);
      }
    }, 2000); // Wait 2 seconds after user stops typing

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostForm.watch("venueAddress"), mounted, isEditing, role]);

  // Auto-fill locality, city, and state when postal code changes
  useEffect(() => {
    if (!mounted || !isEditing || role !== "HOST") return;
    
    // Check if postal code is valid (at least 4-6 digits)
    if (!postalCode || postalCode.trim().length < 4) return;
    
    // Only proceed if locality, city, or state are empty
    if (locality && city && state) return;

    // Debounce auto-fill
    const timeoutId = setTimeout(async () => {
      setIsAutoFilling(true);
      try {
        // Try geocoding with postal code + country if available
        let searchQuery = postalCode.trim();
        if (country) {
          searchQuery = `${postalCode.trim()}, ${country}`;
        }
        
        const res = await apiFetch<{
          locality?: string;
          city?: string;
          state?: string;
          country?: string;
          postalCode?: string;
        }>(`/api/geocode?address=${encodeURIComponent(searchQuery)}`);
        
        if (res.ok && res.data) {
          // Auto-fill empty fields (don't overwrite existing values)
          if (res.data.locality && !locality) setLocality(res.data.locality);
          if (res.data.city && !city) setCity(res.data.city);
          if (res.data.state && !state) setState(res.data.state);
          if (res.data.country && !country) setCountry(res.data.country);
        }
      } catch (error) {
        // Silently fail - user can fill manually
        console.error("Postal code auto-fill failed:", error);
      } finally {
        setIsAutoFilling(false);
      }
    }, 1500); // Wait 1.5 seconds after user stops typing postal code

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postalCode, mounted, isEditing, role]);

  const onSubmitGuest = useMemo(
    () =>
      guestForm.handleSubmit(async (values) => {
        if (!token) return;
        setServerError(null);
        setSavedMsg(null);
        const res = await apiFetch("/api/guest/profile", {
          method: "PUT",
          headers: { authorization: `Bearer ${token}` },
          body: JSON.stringify(guestSchema.parse(values))
        });
        if (!res.ok) {
          setServerError(res.error);
          return;
        }
        setSavedMsg("Profile saved.");
        setIsEditing(false);
      }),
    [guestForm, router, token]
  );

  const onSubmitHost = useMemo(
    () =>
      hostForm.handleSubmit(async (values) => {
        if (!token) return;
        setServerError(null);
        setSavedMsg(null);
        const payload = {
          ...values,
          locality: locality || "",
          city: city || "",
          state: state || "",
          country: country || "",
          postalCode: postalCode || ""
        };
        const res = await apiFetch("/api/host/profile", {
          method: "PUT",
          headers: { authorization: `Bearer ${token}` },
          body: JSON.stringify(payload as z.output<typeof hostSchema>)
        });
        if (!res.ok) {
          setServerError(res.error);
          return;
        }
        setSavedMsg("Profile saved.");
        setIsEditing(false);
      }),
    [hostForm, router, token, locality, city, state, country, postalCode]
  );

  // Show loading state during SSR or before mount
  if (!mounted) {
    return (
      <main className="py-10">
        <Container className="max-w-xl">
          <div className="text-sm text-ink-700">Loading...</div>
        </Container>
      </main>
    );
  }

  return (
    <main className="py-10">
      <Container className="max-w-xl">
        <div className="flex flex-wrap gap-2">
          <Badge tone="ink">Profile</Badge>
          {role ? <Badge>{role}</Badge> : null}
          <Badge tone="success">Complete setup</Badge>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl tracking-tight text-ink-900">
              Your details
            </h1>
            <p className="mt-2 text-sm text-ink-700">
              {!isEditing && (role === "HOST" || role === "GUEST")
                ? "View and manage your profile"
                : "Please complete your profile to continue."}
            </p>
          </div>
          {(role === "HOST" || role === "GUEST") && !loading && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditing(!isEditing);
                if (isEditing) {
                  // Reset form when canceling edit
                  if (role === "HOST") {
                    const currentValues = hostForm.getValues();
                    hostForm.reset(currentValues);
                  } else if (role === "GUEST") {
                    const currentValues = guestForm.getValues();
                    guestForm.reset(currentValues);
                  }
                }
              }}
            >
              {isEditing ? (
                "Cancel"
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit
                </>
              )}
            </Button>
          )}
        </div>

        <div className="mt-6 rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-card backdrop-blur">
          {serverError ? <Alert title="Error" desc={serverError} /> : null}
          {savedMsg ? <Alert title="Saved" desc={savedMsg} /> : null}

          {loading ? (
            <div className="text-sm text-ink-700">Loading…</div>
          ) : role === "GUEST" ? (
            <>
              {isEditing ? (
                <form onSubmit={onSubmitGuest} className="space-y-4">
                  <Input
                    label="Full name"
                    placeholder="Your name"
                    {...guestForm.register("name")}
                    error={guestForm.formState.errors.name?.message}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Select
                      label="Age"
                      {...guestForm.register("age")}
                      error={guestForm.formState.errors.age?.message}
                    >
                      {AGE_OPTIONS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </Select>
                    <Select
                      label="Gender"
                      {...guestForm.register("gender")}
                      error={guestForm.formState.errors.gender?.message}
                    >
                      {GENDER_OPTIONS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">Bio</label>
                    <textarea
                      {...guestForm.register("bio")}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <Input
                    label="Interests"
                    placeholder="Comma separated (e.g. music, travel)"
                    {...guestForm.register("interests")}
                    error={guestForm.formState.errors.interests?.message}
                  />
                  <div className="flex gap-3">
                    <Button type="submit" disabled={guestForm.formState.isSubmitting}>
                      {guestForm.formState.isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* View Mode for Guest */}
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-ink-600">Full Name</div>
                    <div className="mt-1 text-sm text-ink-900">{guestForm.watch("name") || "Not set"}</div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-ink-600">Age</div>
                      <div className="mt-1 text-sm text-ink-900">{guestForm.watch("age") || "Not set"}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-ink-600">Gender</div>
                      <div className="mt-1 text-sm text-ink-900">{guestForm.watch("gender") || "Not set"}</div>
                    </div>
                  </div>
                  {guestForm.watch("bio") && (
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-ink-600">Bio</div>
                      <div className="mt-1 text-sm text-ink-900">{guestForm.watch("bio")}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-ink-600">Interests</div>
                    <div className="mt-1 text-sm text-ink-900">
                      {guestForm.watch("interests") || "Not set"}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : role === "HOST" ? (
            <>
            {isEditing ? (
              <form onSubmit={onSubmitHost} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="First name"
                    placeholder="First name"
                    {...hostForm.register("firstName")}
                    error={hostForm.formState.errors.firstName?.message}
                  />
                  <Input
                    label="Last name"
                    placeholder="Last name"
                    {...hostForm.register("lastName")}
                    error={hostForm.formState.errors.lastName?.message}
                  />
                </div>

                <Select
                  label="Age"
                  {...hostForm.register("age")}
                  error={hostForm.formState.errors.age?.message}
                >
                  {AGE_OPTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </Select>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Bio</label>
                  <textarea
                    {...hostForm.register("bio")}
                    placeholder="Tell guests about yourself..."
                    rows={4}
                    className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm"
                  />
                </div>

                <Input
                  label="Interests"
                  placeholder="Comma separated (e.g. music, travel)"
                  {...hostForm.register("interests")}
                  error={hostForm.formState.errors.interests?.message as string | undefined}
                />
                <Input
                  label="Venue name"
                  placeholder="e.g. Vishal's Home Kitchen"
                  {...hostForm.register("venueName")}
                  error={hostForm.formState.errors.venueName?.message}
                />
                <div>
                  <Input
                    label="Venue address"
                    placeholder="Full address (e.g., 123 Main Street, Indiranagar, Bengaluru)"
                    {...hostForm.register("venueAddress")}
                    error={hostForm.formState.errors.venueAddress?.message}
                  />
                  {isAutoFilling && (
                    <p className="mt-1 text-xs text-ink-600">Auto-filling address details...</p>
                  )}
                </div>
                <Input
                  label="Locality"
                  placeholder="e.g., Indiranagar (auto-filled from address or postal code)"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                />
                <Input
                  label="City"
                  placeholder="e.g., Bengaluru (auto-filled from address or postal code)"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                <Input
                  label="State"
                  placeholder="e.g., Karnataka (auto-filled from address or postal code)"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
                <Input
                  label="Country"
                  placeholder="e.g., India (auto-filled from address)"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
                <Input
                  label="Postal Code"
                  placeholder="e.g., 560038 (enter to auto-fill locality, city, state)"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />

                <Input
                  label="Cuisine served"
                  placeholder="Comma separated (e.g. North Indian, Vegan)"
                  {...hostForm.register("cuisines")}
                  error={hostForm.formState.errors.cuisines?.message as string | undefined}
                />
                <Input
                  label="Activities available"
                  placeholder="Comma separated (e.g. Carrom, Cards, TV, Music)"
                  {...hostForm.register("activities")}
                  error={hostForm.formState.errors.activities?.message as string | undefined}
                />
                <div className="flex gap-3">
                  <Button type="submit" disabled={hostForm.formState.isSubmitting}>
                    {hostForm.formState.isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                {/* View Mode */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-ink-600">First Name</div>
                    <div className="mt-1 text-sm text-ink-900">{hostForm.watch("firstName") || "Not set"}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-ink-600">Last Name</div>
                    <div className="mt-1 text-sm text-ink-900">{hostForm.watch("lastName") || "Not set"}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-ink-600">Age</div>
                  <div className="mt-1 text-sm text-ink-900">{hostForm.watch("age") || "Not set"}</div>
                </div>
                {hostForm.watch("bio") && (
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-ink-600">Bio</div>
                    <div className="mt-1 text-sm text-ink-900">{hostForm.watch("bio")}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-ink-600">Interests</div>
                  <div className="mt-1 text-sm text-ink-900">
                    {hostForm.watch("interests") || "Not set"}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-ink-600">Venue Name</div>
                  <div className="mt-1 text-sm text-ink-900">{hostForm.watch("venueName") || "Not set"}</div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-ink-600">Venue Address</div>
                  <div className="mt-1 text-sm text-ink-900">{hostForm.watch("venueAddress") || "Not set"}</div>
                </div>
                {/* Always show address fields section if any address data exists */}
                {(locality || city || state || country || postalCode || hostForm.watch("venueAddress")) && (
                  <>
                    {locality && (
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-ink-600">Locality</div>
                        <div className="mt-1 text-sm text-ink-900">{locality}</div>
                      </div>
                    )}
                    {city && (
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-ink-600">City</div>
                        <div className="mt-1 text-sm text-ink-900">{city}</div>
                      </div>
                    )}
                    {state && (
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-ink-600">State</div>
                        <div className="mt-1 text-sm text-ink-900">{state}</div>
                      </div>
                    )}
                    {country && (
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-ink-600">Country</div>
                        <div className="mt-1 text-sm text-ink-900">{country}</div>
                      </div>
                    )}
                    {postalCode && (
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-ink-600">Postal Code</div>
                        <div className="mt-1 text-sm text-ink-900">{postalCode}</div>
                      </div>
                    )}
                  </>
                )}
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-ink-600">Cuisines</div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {(() => {
                      const cuisines = hostForm.watch("cuisines");
                      if (!cuisines) return "Not set";
                      const cuisineArray = Array.isArray(cuisines) 
                        ? cuisines 
                        : typeof cuisines === "string" 
                          ? cuisines.split(", ").filter(Boolean)
                          : [];
                      return cuisineArray.length > 0
                        ? cuisineArray.map((c, i) => (
                            <Badge key={i}>{c}</Badge>
                          ))
                        : "Not set";
                    })()}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-ink-600">Activities</div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {(() => {
                      const activities = hostForm.watch("activities");
                      if (!activities) return "Not set";
                      const activityArray = Array.isArray(activities)
                        ? activities
                        : typeof activities === "string"
                          ? activities.split(", ").filter(Boolean)
                          : [];
                      return activityArray.length > 0
                        ? activityArray.map((a, i) => (
                            <Badge key={i}>{a}</Badge>
                          ))
                        : "Not set";
                    })()}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 space-y-4 border-t border-sand-200 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-ink-900">Venue Images</h3>
                  <p className="mt-1 text-sm text-ink-600">
                    Upload photos of your venue to showcase your space
                  </p>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-ink-900 mb-2">
                  Upload Images
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0 || !token) return;

                    setUploadingVenueImages(true);
                    setServerError(null);

                    try {
                      const formData = new FormData();
                      Array.from(files).forEach((file) => {
                        formData.append("images", file);
                      });

                      const res = await fetch("/api/upload/venue-images", {
                        method: "POST",
                        headers: { authorization: `Bearer ${token}` },
                        body: formData
                      });

                      const json = await res.json();

                      if (!res.ok) {
                        setServerError(json.error || "Failed to upload images");
                        return;
                      }

                      if (json.data?.images) {
                        setVenueImages([...venueImages, ...json.data.images]);
                        setSavedMsg(`${json.data.images.length} image(s) uploaded successfully`);
                      }
                    } catch (err) {
                      setServerError("Failed to upload images");
                    } finally {
                      setUploadingVenueImages(false);
                      e.target.value = ""; // Reset input
                    }
                  }}
                  disabled={uploadingVenueImages || !token}
                  className="block w-full text-sm text-ink-700 file:mr-4 file:py-2 file:px-4 file:rounded-2xl file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90 file:cursor-pointer disabled:opacity-50"
                />
                {uploadingVenueImages && (
                  <p className="mt-2 text-sm text-ink-600">Uploading...</p>
                )}
              </div>

              {/* Display Images */}
              {venueImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                  {venueImages.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={`/api/upload/serve?path=${encodeURIComponent(img.filePath)}`}
                        alt={img.fileName}
                        className="w-full h-32 object-cover rounded-2xl border border-sand-200"
                      />
                      <button
                        onClick={async () => {
                          if (!token) return;
                          try {
                            const res = await fetch(
                              `/api/upload/venue-images?imagePath=${encodeURIComponent(img.filePath)}`,
                              {
                                method: "DELETE",
                                headers: { authorization: `Bearer ${token}` }
                              }
                            );
                            if (res.ok) {
                              setVenueImages(venueImages.filter((_, i) => i !== idx));
                              setSavedMsg("Image removed successfully");
                            }
                          } catch (err) {
                            setServerError("Failed to remove image");
                          }
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </>
          ) : (
            <div className="text-sm text-ink-700">No profile fields for this role yet.</div>
          )}

          {role === "GUEST" && !loading && guestOverview ? (
            <div className="mt-8 space-y-6">
              <div>
                <div className="text-sm font-medium text-ink-900">Attended events</div>
                <div className="mt-2 grid gap-3">
                  {guestOverview.attendedEvents.length === 0 ? (
                    <div className="text-sm text-ink-700">No attended events yet.</div>
                  ) : (
                    guestOverview.attendedEvents.map((ev) => (
                      <div
                        key={ev.bookingId}
                        className="rounded-2xl border border-sand-200 bg-white/60 p-4 text-sm"
                      >
                        <div className="font-medium text-ink-900">{ev.eventName}</div>
                        <div className="mt-1 text-ink-700">
                          {ev.venueName}
                          {ev.venueLocality ? ` • ${ev.venueLocality}` : ""}
                        </div>
                        <div className="mt-1 text-ink-700">
                          Seats: {ev.seats} • Paid: ₹{(ev.amountTotal / 100).toFixed(0)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-ink-900">Ratings you gave</div>
                <div className="mt-2 grid gap-3">
                  {guestOverview.feedbackGiven.length === 0 ? (
                    <div className="text-sm text-ink-700">No ratings yet.</div>
                  ) : (
                    guestOverview.feedbackGiven.map((f) => (
                      <div
                        key={f.feedbackId}
                        className="rounded-2xl border border-sand-200 bg-white/60 p-4 text-sm"
                      >
                        <div className="font-medium text-ink-900">
                          {f.eventName || "Event"} • {f.toUserName || "User"}
                        </div>
                        <div className="mt-1 text-ink-700">Rating: {f.rating}/5</div>
                        {f.comment ? (
                          <div className="mt-1 text-ink-700">{f.comment}</div>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </Container>
    </main>
  );
}

