"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/http";
import { setSession } from "@/lib/session";

interface GoogleSignInButtonProps {
  role: "GUEST" | "HOST";
  variant?: "signin" | "signup";
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          prompt: (notificationCallback?: (notification: any) => void) => void;
          renderButton: (element: HTMLElement, config: {
            type: string;
            theme: string;
            size: string;
            text: string;
            width?: string;
            onSuccess?: (response: { credential: string }) => void;
            onError?: (error: any) => void;
          }) => void;
        };
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: any) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

export function GoogleSignInButton({ role, variant = "signin", onSuccess, onError }: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || typeof window === "undefined") return;

    // Load Google Sign-In script
    if (!window.google) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => setScriptLoaded(true);
      document.head.appendChild(script);
    } else {
      setScriptLoaded(true);
    }
  }, []);

  const handleGoogleCallback = useCallback(async (credential: string) => {
    try {
      setLoading(true);

      // Send token to backend
      const res = await apiFetch<{
        accessToken: string;
        role: string;
        userId: string;
        profileComplete: boolean;
        redirectTo: string;
      }>("/api/auth/google/callback", {
        method: "POST",
        body: JSON.stringify({
          idToken: credential,
          role: role
        })
      });

      if (!res.ok) {
        throw new Error(res.error || "Google authentication failed");
      }

      // Set session
      setSession({
        accessToken: res.data.accessToken,
        role: res.data.role as "ADMIN" | "HOST" | "GUEST"
      });

      // Dispatch session change event
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("dah_session_change"));
      }

      // Redirect based on profile completeness
      router.push(res.data.redirectTo);

      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to sign in with Google";
      console.error("Google sign-in error:", error);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [role, router, onSuccess, onError]);

  const handleButtonClick = useCallback(() => {
    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        const errorMsg = "Google OAuth not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment variables.";
        console.error('[Google Sign-In]', errorMsg);
        onError?.(errorMsg);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      // Use OAuth authorization code flow (more reliable for server-side)
      // Note: This requires GOOGLE_CLIENT_SECRET to be set in server environment
      const redirectUri = `${window.location.origin}/api/auth/google/callback`;
      const scope = "openid email profile";
      const responseType = "code"; // Use authorization code flow
      const state = role; // Simple state with just role
      
      // Log the redirect URI for debugging
      console.log('[Google Sign-In] Initiating OAuth flow...');
      console.log('[Google Sign-In] Redirect URI:', redirectUri);
      console.log('[Google Sign-In] Role:', role);
      console.log('[Google Sign-In] Client ID:', clientId.substring(0, 20) + '...');
      console.log('[Google Sign-In] State:', state);
      console.log('[Google Sign-In] Response Type:', responseType);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Google Sign-In] Make sure this exact URI is added in Google Cloud Console:');
        console.log('[Google Sign-In] APIs & Services > Credentials > Your OAuth Client > Authorized redirect URIs');
        console.log('[Google Sign-In] Required redirect URI:', redirectUri);
      }
      
      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}&access_type=offline&prompt=consent`;
      
      console.log('[Google Sign-In] Redirecting to Google OAuth...');
      window.location.href = url;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to initiate Google sign-in";
      console.error('[Google Sign-In] Error:', error);
      onError?.(errorMsg);
      setLoading(false);
    }
  }, [role, onError]);

  useEffect(() => {
    if (!buttonRef.current) return;

    // Always render custom button with our text
    buttonRef.current.innerHTML = "";
    const customButton = document.createElement("button");
    customButton.type = "button";
    customButton.disabled = loading;
    customButton.className = "w-full flex items-center justify-center gap-3 px-4 py-2 border border-sand-300 rounded-lg bg-white hover:bg-sand-50 transition-colors text-ink-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed";
    customButton.innerHTML = `
      <svg class="w-5 h-5" viewBox="0 0 24 24">
        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      <span>${loading ? (variant === "signup" ? "Signing up..." : "Signing in...") : variant === "signup" ? (role === "HOST" ? "Sign up with Google as Host" : "Sign up with Google as Guest") : (role === "HOST" ? "Sign in with Google as Host" : "Sign in with Google as Guest")}</span>
    `;
    customButton.onclick = handleButtonClick;
    buttonRef.current.appendChild(customButton);
  }, [loading, role, variant, handleButtonClick]);

  return <div ref={buttonRef} className="w-full" />;
}
