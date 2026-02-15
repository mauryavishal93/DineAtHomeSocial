"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

import { apiFetch } from "@/lib/http";
import { getAccessToken, getRole } from "@/lib/session";
import { rupeesToPaise } from "@/lib/currency";

// Dynamically import AddressMap to avoid SSR issues with Leaflet
const AddressMap = dynamic(() => import("@/components/map/address-map").then((mod) => mod.AddressMap), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 rounded-lg border border-sand-200 bg-sand-100 flex items-center justify-center text-sm text-ink-600">
      Loading map...
    </div>
  )
});

const schema = z.object({
  eventName: z.string().min(1).max(120),
  startAt: z.string().min(1),
  durationHours: z.coerce.number().int().min(1).max(24),
  maxGuests: z.coerce.number().int().min(1).max(200),
  basePricePerGuest: z.coerce.number().int().min(0),
  foodType: z.string().max(120).optional().default(""),
  cuisines: z.string().optional().default(""),
  activities: z.string().optional().default(""),
  tags: z.string().optional().default(""),
  optionVeg: z.coerce.boolean().optional().default(true),
  optionNonVeg: z.coerce.boolean().optional().default(false),
  optionAlcohol: z.coerce.boolean().optional().default(false),
  optionNonAlcohol: z.coerce.boolean().optional().default(true)
});
type FormValues = z.input<typeof schema>;

export default function HostCreateEventClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = getAccessToken();
  const role = getRole();
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverOk, setServerOk] = useState<string | null>(null);
  const [venueAddress, setVenueAddress] = useState<string>("");
  const [venueLatitude, setVenueLatitude] = useState<number | null>(null);
  const [venueLongitude, setVenueLongitude] = useState<number | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Get date from URL params if available
  const dateParam = searchParams.get("date");
  const defaultStartAt = dateParam
    ? new Date(dateParam + "T12:00").toISOString().slice(0, 16) // Format for datetime-local input
    : "";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      durationHours: 3,
      maxGuests: 10,
      basePricePerGuest: 799,
      startAt: defaultStartAt
    }
  });

  // Update startAt if date param changes
  useEffect(() => {
    if (dateParam) {
      const formattedDate = new Date(dateParam + "T12:00").toISOString().slice(0, 16);
      setValue("startAt", formattedDate);
    }
  }, [dateParam, setValue]);

  useEffect(() => {
    if (!token) {
      router.push("/auth/login");
      return;
    }
    if (role !== "HOST") {
      router.push("/");
      return;
    }

    (async () => {
      const res = await apiFetch<{
        venueAddress: string;
        cuisines: string[];
        activities: string[];
        latitude?: number | null;
        longitude?: number | null;
      }>("/api/host/profile", {
        method: "GET",
        headers: { authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      setVenueAddress(res.data.venueAddress ?? "");
      setVenueLatitude(res.data.latitude ?? null);
      setVenueLongitude(res.data.longitude ?? null);
      setValue("cuisines", (res.data.cuisines ?? []).join(", "));
      setValue("activities", (res.data.activities ?? []).join(", "));
    })();
  }, [role, router, setValue, token]);

  const handleLocationSelect = (address: string, lat: number, lng: number) => {
    setVenueLatitude(lat);
    setVenueLongitude(lng);
    if (address && address !== venueAddress) {
      setVenueAddress(address);
    }
  };

  const onSubmit = useMemo(
    () =>
      handleSubmit(async (values) => {
        if (!token) return;
        setServerError(null);
        setServerOk(null);

        const payload = schema.parse(values);
        // Convert price from rupees to paise before sending to API
        const payloadWithPaise = {
          ...payload,
          basePricePerGuest: rupeesToPaise(payload.basePricePerGuest)
        };
        setUploadingMedia(true);

        // Step 1: Create event
        const res = await apiFetch<{ eventSlotId: string }>("/api/host/events", {
          method: "POST",
          headers: { authorization: `Bearer ${token}` },
          body: JSON.stringify(payloadWithPaise)
        });
        if (!res.ok) {
          setServerError(res.error);
          setUploadingMedia(false);
          return;
        }

        const eventId = res.data.eventSlotId;

        // Step 2: Upload images and videos if provided
        if (selectedImages.length > 0 || selectedVideos.length > 0) {
          try {
            const formData = new FormData();
            formData.append("eventId", eventId);
            selectedImages.forEach((file) => {
              formData.append("images", file);
            });
            selectedVideos.forEach((file) => {
              formData.append("videos", file);
            });

            const uploadRes = await fetch("/api/upload/event-media", {
              method: "POST",
              headers: { authorization: `Bearer ${token}` },
              body: formData
            });

            const uploadJson = await uploadRes.json();

            if (!uploadRes.ok) {
              setServerError(uploadJson.error || "Event created but failed to upload media");
              setUploadingMedia(false);
              return;
            }

            setServerOk(
              `Event created successfully! ${selectedImages.length} image(s) and ${selectedVideos.length} video(s) uploaded.`
            );
          } catch {
            setServerError("Event created but failed to upload media. You can add them later.");
          }
        } else {
          setServerOk("Event created successfully! You can add images and videos later.");
        }

        setUploadingMedia(false);

        // Redirect to event detail page
        setTimeout(() => {
          router.push(`/events/${eventId}`);
        }, 1500);
      }),
    [handleSubmit, router, token, selectedImages, selectedVideos]
  );

  return (
    <main className="py-10">
      <Container className="max-w-2xl">
        <div className="flex flex-wrap gap-2">
          <Badge tone="ink">Host</Badge>
          <Badge>Create event</Badge>
        </div>
        <h1 className="mt-4 font-display text-4xl tracking-tight text-ink-900">Publish an event</h1>
        <p className="mt-2 text-sm text-ink-700">
          Cuisine and activities are prefilled from your host setup, but you can adjust them for this event.
        </p>

        <div className="mt-6 rounded-3xl border border-sand-200 bg-white/60 p-6 shadow-card backdrop-blur">
          {serverError ? <Alert title="Error" desc={serverError} /> : null}
          {serverOk ? <Alert title="Success" desc={serverOk} /> : null}

          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Event name"
              placeholder="e.g. Sunday dinner social"
              {...register("eventName")}
              error={errors.eventName?.message}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Start date & time"
                type="datetime-local"
                {...register("startAt")}
                error={errors.startAt?.message}
              />
              <Input
                label="Duration (hours)"
                type="number"
                min={1}
                max={24}
                {...register("durationHours")}
                error={errors.durationHours?.message}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Max guests" type="number" min={1} max={200} {...register("maxGuests")} error={errors.maxGuests?.message} />
              <Input
                label="Price per guest (₹)"
                type="number"
                min={0}
                step="1"
                {...register("basePricePerGuest")}
                error={errors.basePricePerGuest?.message}
              />
            </div>

            <Input label="Food served" placeholder="e.g. Thali, Biryani, Snacks" {...register("foodType")} error={errors.foodType?.message} />
            <Input label="Cuisine (comma separated)" {...register("cuisines")} error={errors.cuisines?.message} />
            <Input label="Activities (comma separated)" {...register("activities")} error={errors.activities?.message} />
            <Input label="Extra tags (comma separated)" placeholder="e.g. halal, vegan" {...register("tags")} error={errors.tags?.message} />

            <div className="rounded-2xl border border-sand-200 bg-white/60 p-4 text-sm text-ink-700">
              <div className="font-medium text-ink-900">Options</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked {...register("optionVeg")} />
                  Veg
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...register("optionNonVeg")} />
                  Non-veg
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...register("optionAlcohol")} />
                  Alcohol
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked {...register("optionNonAlcohol")} />
                  Non-alcohol
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-sand-200 bg-white/60 p-4 text-sm">
              <div className="font-medium text-ink-900">Address</div>
              <div className="mt-1 text-ink-700">{venueAddress || "Missing venue address (complete host setup)."}</div>
            </div>

            {venueAddress ? (
              <div className="rounded-2xl border border-sand-200 bg-white/60 overflow-hidden">
                <AddressMap
                  address={venueAddress}
                  latitude={venueLatitude}
                  longitude={venueLongitude}
                  editable={false}
                  onLocationSelect={handleLocationSelect}
                />
              </div>
            ) : null}

            {/* Image and Video Upload Section */}
            <div className="space-y-4 rounded-2xl border border-sand-200 bg-white/60 p-4">
              <div className="font-medium text-ink-900">Event Media (Optional)</div>
              <p className="text-sm text-ink-600">Add photos and videos to showcase your event. You can also add them later.</p>

              <div>
                <label className="block text-sm font-medium text-ink-900 mb-2">Upload Images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setSelectedImages(Array.from(e.target.files || []))}
                  disabled={uploadingMedia || isSubmitting}
                  className="block w-full text-sm text-ink-700 file:mr-4 file:py-2 file:px-4 file:rounded-2xl file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90 file:cursor-pointer disabled:opacity-50"
                />
                {selectedImages.length > 0 ? <p className="mt-2 text-sm text-ink-600">{selectedImages.length} image(s) selected</p> : null}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-900 mb-2">Upload Videos</label>
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={(e) => setSelectedVideos(Array.from(e.target.files || []))}
                  disabled={uploadingMedia || isSubmitting}
                  className="block w-full text-sm text-ink-700 file:mr-4 file:py-2 file:px-4 file:rounded-2xl file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90 file:cursor-pointer disabled:opacity-50"
                />
                {selectedVideos.length > 0 ? <p className="mt-2 text-sm text-ink-600">{selectedVideos.length} video(s) selected</p> : null}
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting || uploadingMedia}>
              {uploadingMedia ? "Publishing & Uploading..." : isSubmitting ? "Publishing..." : "Publish event"}
            </Button>
          </form>
        </div>
      </Container>
    </main>
  );
}

