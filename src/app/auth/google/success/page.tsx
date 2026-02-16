"use client";

import { useEffect, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setSession } from "@/lib/session";

export const dynamic = 'force-dynamic';

function GoogleAuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (attempted) return; // Prevent multiple attempts
    setAttempted(true);

    // Add a delay to ensure cookies are available after redirect
    const processAuth = () => {
      const redirect = searchParams.get('redirect') || '/';
      const role = searchParams.get('role') || 'GUEST';

      console.log('[Google Auth Success] Processing authentication...');
      console.log('[Google Auth Success] Redirect:', redirect);
      console.log('[Google Auth Success] Role:', role);
      console.log('[Google Auth Success] Current URL:', window.location.href);
      console.log('[Google Auth Success] All cookies:', document.cookie);
      console.log('[Google Auth Success] Cookie string length:', document.cookie.length);

      // Try to get token from URL first (more reliable), then fallback to cookie
      const tokenFromUrl = searchParams.get('token');
      let accessToken: string | null = tokenFromUrl;

      if (!accessToken) {
        // Get the access token from cookie (set by the callback route)
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const parts = cookie.trim().split('=');
          if (parts.length >= 2) {
            const name = parts[0].trim();
            const value = parts.slice(1).join('='); // Handle values with = in them
            if (name === 'google_auth_token') {
              accessToken = decodeURIComponent(value);
              console.log('[Google Auth Success] Found token in cookie, length:', accessToken.length);
              break;
            }
          }
        }
      } else {
        console.log('[Google Auth Success] Found token in URL, length:', accessToken.length);
        // Remove token from URL immediately for security
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('token');
        window.history.replaceState({}, '', cleanUrl.toString());
        console.log('[Google Auth Success] Token removed from URL');
      }
      
      if (accessToken && accessToken.length > 0) {
        console.log('[Google Auth Success] Token found, setting session...');
        console.log('[Google Auth Success] Role:', role.toUpperCase());
        
        try {
          setSession({
            accessToken,
            role: role.toUpperCase() as "ADMIN" | "HOST" | "GUEST"
          });

          // Verify session was set
          const storedToken = localStorage.getItem('dah_access_token');
          const storedRole = localStorage.getItem('dah_role');
          console.log('[Google Auth Success] Session verification:');
          console.log('[Google Auth Success] - Token stored:', !!storedToken, storedToken ? `(length: ${storedToken.length})` : '');
          console.log('[Google Auth Success] - Role stored:', storedRole);

          if (!storedToken || storedToken !== accessToken) {
            throw new Error('Session token mismatch - token was not stored correctly');
          }

          // Dispatch session change event
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("dah_session_change"));
            console.log('[Google Auth Success] Session change event dispatched');
          }

          // Clear the temporary cookie
          document.cookie = 'google_auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          console.log('[Google Auth Success] Temporary cookie cleared');

          // Small delay to ensure session is set and persisted
          setTimeout(() => {
            console.log('[Google Auth Success] Redirecting to:', redirect);
            router.push(redirect);
          }, 300);
        } catch (error) {
          console.error('[Google Auth Success] Error setting session:', error);
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          router.push('/auth/login?error=' + encodeURIComponent('Failed to set session: ' + errorMsg));
        }
      } else {
        console.error('[Google Auth Success] No access token found in cookies');
        console.error('[Google Auth Success] Available cookies:', document.cookie);
        console.error('[Google Auth Success] Cookie names:', document.cookie.split(';').map(c => {
          const parts = c.trim().split('=');
          return parts[0];
        }));
        
        // Try multiple times with increasing delays (cookie might not be set yet)
        let retryCount = 0;
        const maxRetries = 3;
        
        const retryAuth = () => {
          retryCount++;
          console.log(`[Google Auth Success] Retry attempt ${retryCount}/${maxRetries}`);
          
          const retryCookies = document.cookie.split(';');
          let retryToken: string | null = null;
          for (const cookie of retryCookies) {
            const parts = cookie.trim().split('=');
            if (parts.length >= 2 && parts[0].trim() === 'google_auth_token') {
              retryToken = decodeURIComponent(parts.slice(1).join('='));
              console.log(`[Google Auth Success] Token found on retry ${retryCount}, length:`, retryToken.length);
              break;
            }
          }
          
          if (retryToken && retryToken.length > 0) {
            console.log('[Google Auth Success] Token found on retry, setting session...');
            try {
              setSession({
                accessToken: retryToken,
                role: role.toUpperCase() as "ADMIN" | "HOST" | "GUEST"
              });
              window.dispatchEvent(new CustomEvent("dah_session_change"));
              document.cookie = 'google_auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
              setTimeout(() => router.push(redirect), 300);
            } catch (error) {
              console.error('[Google Auth Success] Error setting session on retry:', error);
              router.push('/auth/login?error=' + encodeURIComponent('Failed to set session. Please try again.'));
            }
          } else if (retryCount < maxRetries) {
            // Try again with longer delay
            setTimeout(retryAuth, 500 * retryCount);
          } else {
            console.error('[Google Auth Success] Token still not found after all retries');
            router.push('/auth/login?error=' + encodeURIComponent('Authentication failed: No token received. Please try signing in again.'));
          }
        };
        
        // Start retry after initial delay
        setTimeout(retryAuth, 500);
      }
    };

    // Small delay to ensure cookies are set after redirect
    const timeoutId = setTimeout(processAuth, 200);
    
    return () => clearTimeout(timeoutId);
  }, [router, searchParams, attempted]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-ink-600">Completing sign-in...</p>
        <p className="text-xs text-ink-500 mt-2">Please wait...</p>
      </div>
    </div>
  );
}

export default function GoogleAuthSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-ink-600">Loading...</p>
        </div>
      </div>
    }>
      <GoogleAuthSuccessContent />
    </Suspense>
  );
}
