"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export type AdditionalGuest = {
  name: string;
  mobile: string;
  age: number;
  gender: string;
};

type AddGuestModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (guest: AdditionalGuest) => void;
  guestNumber: number;
};

export function AddGuestModal({ isOpen, onClose, onSave, guestNumber }: AddGuestModalProps) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSave = () => {
    // Validation
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!mobile.trim() || mobile.length < 10) {
      setError("Valid mobile number is required");
      return;
    }
    if (!age || parseInt(age) < 1 || parseInt(age) > 99) {
      setError("Age must be between 1 and 99");
      return;
    }
    if (!gender) {
      setError("Gender is required");
      return;
    }

    onSave({
      name: name.trim(),
      mobile: mobile.trim(),
      age: parseInt(age),
      gender
    });

    // Reset form
    setName("");
    setMobile("");
    setAge("");
    setGender("");
    setError("");
    onClose();
  };

  const handleClose = () => {
    setName("");
    setMobile("");
    setAge("");
    setGender("");
    setError("");
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-ink-900/50 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-md rounded-3xl border border-sand-200 bg-white p-8 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-full p-2 text-ink-600 transition-colors hover:bg-sand-100 hover:text-ink-900"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Icon */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
            <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-center font-display text-2xl tracking-tight text-ink-900">
            Add Guest #{guestNumber}
          </h2>
          <p className="mt-2 text-center text-sm text-ink-700">
            Provide details for your additional guest
          </p>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Form */}
          <div className="mt-6 space-y-4">
            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-ink-900">
                Guest Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-ink-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Mobile */}
            <div>
              <label className="mb-2 block text-sm font-medium text-ink-900">
                Mobile Number *
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Enter 10-digit mobile number"
                maxLength={10}
                className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-ink-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Age */}
            <div>
              <label className="mb-2 block text-sm font-medium text-ink-900">
                Age *
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Enter age"
                min="1"
                max="99"
                className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-ink-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="mb-2 block text-sm font-medium text-ink-900">
                Gender *
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-ink-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3">
            <Button onClick={handleSave} className="w-full" size="lg">
              Save Guest Details
            </Button>
            <Button onClick={handleClose} variant="ghost" className="w-full">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
