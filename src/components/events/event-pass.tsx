"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type EventPassData = {
  passId: string;
  eventCode: string;
  guestName: string;
  guestMobile: string;
  guestAge: number;
  guestGender: string;
  passType: "PRIMARY" | "ADDITIONAL";
  isValid: boolean;
  validatedAt: string | null;
  event: {
    eventId: string;
    eventName: string;
    startAt: string;
    endAt: string;
    description?: string;
  };
  host: {
    hostId: string;
    hostName: string;
    email: string;
    mobile: string;
    address: string;
    locality: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  venue: {
    venueId: string;
    name: string;
    address: string;
    locality: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  } | null;
};

type EventPassProps = {
  pass: EventPassData;
  onClose?: () => void;
};

export function EventPass({ pass, onClose }: EventPassProps) {
  const [mounted, setMounted] = useState(false);
  const [downloading, setDownloading] = useState<"image" | "pdf" | null>(null);
  const passRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatDate = (dateString: string) => {
    if (!mounted) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(date);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  const downloadAsImage = async () => {
    if (!passRef.current) return;
    
    setDownloading("image");
    try {
      const canvas = await html2canvas(passRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const link = document.createElement("a");
      link.download = `EventPass-${pass.eventCode}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Failed to download image:", error);
      alert("Failed to download image. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  const downloadAsPDF = async () => {
    if (!passRef.current) return;
    
    setDownloading("pdf");
    try {
      const canvas = await html2canvas(passRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
        width: passRef.current.scrollWidth,
        height: passRef.current.scrollHeight
      });
      
      const imgData = canvas.toDataURL("image/png");
      
      // Calculate PDF dimensions to fit the content
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      const pdf = new jsPDF({
        orientation: pdfHeight > 297 ? "portrait" : "portrait",
        unit: "mm",
        format: pdfHeight > 297 ? [pdfWidth, pdfHeight] : [pdfWidth, Math.max(pdfHeight, 100)]
      });
      
      // Add image to PDF, scaling to fit width
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`EventPass-${pass.eventCode}.pdf`);
    } catch (error) {
      console.error("Failed to download PDF:", error);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  const venueAddress = pass.venue 
    ? `${pass.venue.address || ""}${pass.venue.locality ? `, ${pass.venue.locality}` : ""}${pass.venue.city ? `, ${pass.venue.city}` : ""}${pass.venue.state ? `, ${pass.venue.state}` : ""}${pass.venue.postalCode ? ` ${pass.venue.postalCode}` : ""}`.trim()
    : `${pass.host.address || ""}${pass.host.locality ? `, ${pass.host.locality}` : ""}${pass.host.city ? `, ${pass.host.city}` : ""}${pass.host.state ? `, ${pass.host.state}` : ""}${pass.host.postalCode ? ` ${pass.host.postalCode}` : ""}`.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Event Pass</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-white/90 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Pass Content */}
        <div className="p-6 space-y-6">
          {/* Download Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={downloadAsImage}
              disabled={downloading !== null}
              className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
            >
              {downloading === "image" ? "Downloading..." : "📥 Download Image"}
            </Button>
            <Button
              onClick={downloadAsPDF}
              disabled={downloading !== null}
              variant="outline"
              className="flex-1 border-violet-300 text-violet-700 hover:bg-violet-50"
            >
              {downloading === "pdf" ? "Downloading..." : "📄 Download PDF"}
            </Button>
          </div>

          {/* Pass Card */}
          <div
            ref={passRef}
            className="bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 rounded-2xl p-6 border-2 border-violet-200 shadow-lg"
          >
            {/* Logo/Header */}
            <div className="text-center mb-6">
              <div className="inline-block p-3 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full mb-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 013.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 3.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-3.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-3.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-ink-900 mb-1">{pass.event.eventName}</h1>
              <p className="text-sm text-ink-600">DineAtHome Social Event</p>
            </div>

            {/* Guest Info */}
            <div className="bg-white/80 rounded-xl p-4 mb-4 border border-violet-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-ink-900">Guest Information</h3>
                {pass.isValid ? (
                  <Badge tone="success" className="text-xs">Valid</Badge>
                ) : (
                  <Badge tone="warning" className="text-xs">Used</Badge>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-600">Name:</span>
                  <span className="font-medium text-ink-900">{pass.guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-600">Age:</span>
                  <span className="font-medium text-ink-900">{pass.guestAge} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-600">Mobile:</span>
                  <span className="font-medium text-ink-900">{pass.guestMobile}</span>
                </div>
              </div>
            </div>

            {/* Event Code - Prominent */}
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl p-5 mb-4 text-center">
              <p className="text-xs text-white/80 mb-2 uppercase tracking-wider">Your Event Code</p>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border-2 border-white/30">
                <p className="text-3xl font-bold text-white tracking-wider font-mono">{pass.eventCode}</p>
              </div>
              <p className="text-xs text-white/80 mt-2">Show this code to the host at check-in</p>
            </div>

            {/* Event Details */}
            <div className="bg-white/80 rounded-xl p-4 mb-4 border border-violet-100">
              <h3 className="font-semibold text-ink-900 mb-3">Event Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-violet-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-ink-600">{formatDate(pass.event.startAt)}</p>
                    <p className="text-ink-900 font-medium">{formatTime(pass.event.startAt)} - {formatTime(pass.event.endAt)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-violet-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-ink-600 text-xs">Venue Location</p>
                    <p className="text-ink-900 font-medium text-xs">{venueAddress || "Host's location"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Host Information */}
            <div className="bg-white/80 rounded-xl p-4 mb-4 border border-violet-100">
              <h3 className="font-semibold text-ink-900 mb-3">Host Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-violet-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-ink-600 text-xs mb-1">Host Name</p>
                    <p className="text-ink-900 font-medium">{pass.host.hostName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-violet-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-ink-600 text-xs mb-1">Email</p>
                    <p className="text-ink-900 font-medium text-xs break-all">{pass.host.email}</p>
                  </div>
                </div>
                {pass.host.mobile && (
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-violet-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-ink-600 text-xs mb-1">Mobile</p>
                      <p className="text-ink-900 font-medium">{pass.host.mobile}</p>
                    </div>
                  </div>
                )}
                {(pass.host.address || venueAddress) && (
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-violet-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-ink-600 text-xs mb-1">Address</p>
                      <p className="text-ink-900 font-medium text-xs leading-relaxed">
                        {pass.host.address || venueAddress || "Host's location"}
                        {pass.host.locality && `, ${pass.host.locality}`}
                        {pass.host.city && `, ${pass.host.city}`}
                        {pass.host.state && `, ${pass.host.state}`}
                        {pass.host.postalCode && ` ${pass.host.postalCode}`}
                        {pass.host.country && `, ${pass.host.country}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-4 pt-4 border-t border-violet-200">
              <p className="text-xs text-ink-500">
                This pass is valid only for the specified event date and time.
              </p>
              {pass.validatedAt && (
                <p className="text-xs text-ink-500 mt-1">
                  Checked in: {mounted ? new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit"
                  }).format(new Date(pass.validatedAt)) : ""}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
