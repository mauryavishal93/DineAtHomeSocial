"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { clearSession } from "@/lib/session";

type BecomeHostModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function BecomeHostModal({ isOpen, onClose }: BecomeHostModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleLogout = () => {
    clearSession();
    onClose();
    router.push("/auth/register/host");
    router.refresh();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-ink-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-md rounded-3xl border border-sand-200 bg-white p-8 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-ink-600 transition-colors hover:bg-sand-100 hover:text-ink-900"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Icon */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
            <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-center font-display text-2xl tracking-tight text-ink-900">
            Ready to Open Your Table?
          </h2>

          {/* Description */}
          <p className="mt-4 text-center text-ink-700">
            To become a host, you'll need to create a new account with hosting privileges. 
            This means logging out of your current guest account.
          </p>

          {/* Info Box */}
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-sm text-amber-800">
                <p className="font-medium">Don't worry!</p>
                <p className="mt-1">Your guest account will remain active. You can always log back in to book events as a guest.</p>
              </div>
            </div>
          </div>

          {/* Benefits List */}
          <div className="mt-6 space-y-2">
            <div className="flex items-start gap-2 text-sm text-ink-700">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Share your culinary passion with others</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-ink-700">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Earn money hosting memorable experiences</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-ink-700">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Build a community around your table</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3">
            <Button
              onClick={handleLogout}
              className="w-full"
              size="lg"
            >
              Continue as Host
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full"
              size="lg"
            >
              Stay as Guest
            </Button>
          </div>

          {/* Footer Note */}
          <p className="mt-4 text-center text-xs text-ink-600">
            You'll be redirected to the host registration page
          </p>
        </div>
      </div>
    </>
  );
}
