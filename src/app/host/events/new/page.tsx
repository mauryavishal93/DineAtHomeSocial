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
import { Button } from "@/components/ui/button";

import { apiFetch } from "@/lib/http";
import { getAccessToken, getRole } from "@/lib/session";

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

export default function HostCreateEventPage() {
  const router = useRouter();
  const token = getAccessToken();
  const role = getRole();
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverOk, setServerOk] = useState<string | null>(null);
  const [venueAddress, setVenueAddress] = useState<string>("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { durationHours: 3, maxGuests: 10, basePricePerGuest: 79900 }
  });

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
      }>("/api/host/profile", {
        method: "GET",
        headers: { authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      setVenueAddress(res.data.venueAddress ?? "");
      setValue("cuisines", (res.data.cuisines ?? []).join(", "));
      setValue("activities", (res.data.activities ?? []).join(", "));
    })();
  }, [role, router, setValue, token]);

  const mapSrc = useMemo(() => {
    const q = encodeURIComponent(venueAddress || "");
    if (!q) return null;
    return `https://www.google.com/maps?q=${q}&output=embed`;
  }, [venueAddress]);

  const onSubmit = useMemo(
    () =>
      handleSubmit(async (values) => {
        if (!token) return;
        setServerError(null);
        setServerOk(null);

        const payload = schema.parse(values);
        setUploadingMedia(true);
        
        // Step 1: Create event
        const res = await apiFetch<{ eventSlotId: string }>("/api/host/events", {
          method: "POST",
          headers: { authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
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

            setServerOk(`Event created successfully! ${selectedImages.length} image(s) and ${selectedVideos.length} video(s) uploaded.`);
          } catch (uploadErr) {
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
    [handleSubmit, router, token]
  );

  return (
    <main className="py-10">
      <Container className="max-w-2xl">
        <div className="flex flex-wrap gap-2">
          <Badge tone="ink">Host</Badge>
          <Badge>Create event</Badge>
        </div>
        <h1 className="mt-4 font-display text-4xl tracking-tight text-ink-900">
          Publish an event
        </h1>
        <p className="mt-2 text-sm text-ink-700">
          Cuisine and activities are prefilled from your host setup, but you can adjust them
          for this event.
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
              <Input
                label="Max guests"
                type="number"
                min={1}
                max={200}
                {...register("maxGuests")}
                error={errors.maxGuests?.message}
              />
              <Input
                label="Price per guest (paise)"
                type="number"
                min={0}
                {...register("basePricePerGuest")}
                error={errors.basePricePerGuest?.message}
              />
            </div>

            <Input
              label="Food served"
              placeholder="e.g. Thali, Biryani, Snacks"
              {...register("foodType")}
              error={errors.foodType?.message}
            />

            <Input
              label="Cuisine (comma separated)"
              {...register("cuisines")}
              error={errors.cuisines?.message}
            />

            <Input
              label="Activities (comma separated)"
              {...register("activities")}
              error={errors.activities?.message}
            />

            <Input
              label="Extra tags (comma separated)"
              placeholder="e.g. halal, vegan"
              {...register("tags")}
              error={errors.tags?.message}
            />

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
              <div className="mt-1 text-ink-700">
                {venueAddress || "Missing venue address (complete host setup)."}
              </div>
            </div>

            {mapSrc ? (
              <div className="overflow-hidden rounded-2xl border border-sand-200 bg-white/60">
                <iframe title="Map preview" src={mapSrc} className="h-56 w-full" loading="lazy" />
              </div>
            ) : null}

            {/* Image and Video Upload Section */}
            <div className="space-y-4 rounded-2xl border border-sand-200 bg-white/60 p-4">
              <div className="font-medium text-ink-900">Event Media (Optional)</div>
              <p className="text-sm text-ink-600">
                Add photos and videos to showcase your event. You can also add them later.
              </p>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-ink-900 mb-2">
                  Upload Images
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setSelectedImages(files);
                  }}
                  disabled={uploadingMedia || isSubmitting}
                  className="block w-full text-sm text-ink-700 file:mr-4 file:py-2 file:px-4 file:rounded-2xl file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90 file:cursor-pointer disabled:opacity-50"
                />
                {selectedImages.length > 0 && (
                  <p className="mt-2 text-sm text-ink-600">
                    {selectedImages.length} image(s) selected
                  </p>
                )}
              </div>

              {/* Video Upload */}
              <div>
                <label className="block text-sm font-medium text-ink-900 mb-2">
                  Upload Videos
                </label>
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setSelectedVideos(files);
                  }}
                  disabled={uploadingMedia || isSubmitting}
                  className="block w-full text-sm text-ink-700 file:mr-4 file:py-2 file:px-4 file:rounded-2xl file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90 file:cursor-pointer disabled:opacity-50"
                />
                {selectedVideos.length > 0 && (
                  <p className="mt-2 text-sm text-ink-600">
                    {selectedVideos.length} video(s) selected
                  </p>
                )}
              </div>

              {/* Preview Selected Media */}
              {(selectedImages.length > 0 || selectedVideos.length > 0) && (
                <div className="mt-4 pt-4 border-t border-sand-200">
                  <div className="text-sm font-medium text-ink-900 mb-2">Preview</div>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedImages.map((file, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-24 object-cover rounded-lg border border-sand-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = selectedImages.filter((_, i) => i !== idx);
                            setSelectedImages(newImages);
                          }}
                          className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {selectedVideos.map((file, idx) => (
                      <div key={idx} className="relative">
                        <video
                          src={URL.createObjectURL(file)}
                          className="w-full h-24 object-cover rounded-lg border border-sand-200"
                          controls={false}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newVideos = selectedVideos.filter((_, i) => i !== idx);
                            setSelectedVideos(newVideos);
                          }}
                          className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full text-xs"
                        >
                          ×
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                          {file.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

