import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ok, badRequest, serverError } from "@/server/http/response";
import { connectMongo } from "@/server/db/mongoose";
import { User } from "@/server/models/User";
import { HostProfile } from "@/server/models/HostProfile";
import { GuestProfile } from "@/server/models/GuestProfile";
import { signAccessToken, signRefreshToken } from "@/server/auth/jwt";
import type { Role } from "@/server/models/_types";

export const runtime = "nodejs";

// Verify Google ID token
async function verifyGoogleToken(idToken: string): Promise<{
  sub: string; // Google user ID
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
} | null> {
  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!response.ok) return null;
    const data = await response.json();
    
    // Verify the token is for our app
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || data.aud !== clientId) return null;
    
    return {
      sub: data.sub,
      email: data.email,
      email_verified: data.email_verified === "true" || data.email_verified === true,
      name: data.name,
      picture: data.picture
    };
  } catch (error) {
    console.error("Google token verification error:", error);
    return null;
  }
}

// Check profile completeness
async function checkProfileCompleteness(userId: string, role: Role): Promise<{ complete: boolean; missingFields: string[] }> {
  const missingFields: string[] = [];
  
  if (role === "GUEST") {
    const profile = await GuestProfile.findOne({ userId }).lean() as any;
    const user = await User.findById(userId).lean() as any;
    if (!profile) {
      missingFields.push("profile");
      return { complete: false, missingFields };
    }
    if (!profile.firstName || !profile.lastName) missingFields.push("name");
    if (!profile.age || profile.age === 0) missingFields.push("age");
    if (!profile.gender) missingFields.push("gender");
    if (!user?.mobile) missingFields.push("mobile");
  } else if (role === "HOST") {
    const profile = await HostProfile.findOne({ userId }).lean() as any;
    if (!profile) {
      missingFields.push("profile");
      return { complete: false, missingFields };
    }
    if (!profile.firstName || !profile.lastName) missingFields.push("name");
    if (!profile.venueName) missingFields.push("venueName");
    if (!profile.venueAddress) missingFields.push("venueAddress");
    if (!profile.governmentIdPath) missingFields.push("governmentId");
  }
  
  return { complete: missingFields.length === 0, missingFields };
}

// Handle GET request (OAuth redirect callback)
export async function GET(req: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code"); // Authorization code
    const idToken = searchParams.get("id_token"); // Fallback for id_token flow
    const state = searchParams.get("state"); // This will be the role
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    console.log("[Google OAuth] Callback received");
    console.log("[Google OAuth] URL:", req.url);
    console.log("[Google OAuth] Has code:", !!code);
    console.log("[Google OAuth] Has id_token:", !!idToken);
    console.log("[Google OAuth] Has state:", !!state);
    console.log("[Google OAuth] State value:", state);
    console.log("[Google OAuth] Error:", error);
    console.log("[Google OAuth] Error description:", errorDescription);

    if (error) {
      let errorMsg = error;
      if (error === "redirect_uri_mismatch") {
        const requestUrl = new URL(req.url);
        const redirectUri = `${requestUrl.origin}/api/auth/google/callback`;
        errorMsg = `Redirect URI mismatch. Please add this exact URI to Google Cloud Console: ${redirectUri}. See docs/GOOGLE_OAUTH_SETUP.md for instructions.`;
      } else if (errorDescription) {
        errorMsg = `${error}: ${errorDescription}`;
      }
      console.error("[Google OAuth] Error from Google:", errorMsg);
      return NextResponse.redirect(`${baseUrl}/auth/login?error=${encodeURIComponent(errorMsg)}`);
    }

    // Extract role from state
    const role = state as "GUEST" | "HOST";
    if (role !== "GUEST" && role !== "HOST") {
      console.error("[Google OAuth] Invalid role in state:", state);
      return NextResponse.redirect(`${baseUrl}/auth/login?error=${encodeURIComponent("Invalid role")}`);
    }

    let googleUser: { sub: string; email: string; email_verified: boolean; name?: string; picture?: string } | null = null;

    // Handle authorization code flow (preferred)
    if (code) {
      console.log("[Google OAuth] Processing authorization code flow...");
      const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = `${new URL(req.url).origin}/api/auth/google/callback`;

      console.log("[Google OAuth] Client ID present:", !!clientId);
      console.log("[Google OAuth] Client ID (first 20 chars):", clientId ? clientId.substring(0, 20) + "..." : "MISSING");
      console.log("[Google OAuth] Client Secret present:", !!clientSecret);
      console.log("[Google OAuth] Redirect URI:", redirectUri);

      if (!clientId) {
        console.error("[Google OAuth] Missing GOOGLE_CLIENT_ID");
        return NextResponse.redirect(`${baseUrl}/auth/login?error=${encodeURIComponent("Google OAuth not configured: Missing GOOGLE_CLIENT_ID")}`);
      }

      if (!clientSecret) {
        console.error("[Google OAuth] Missing GOOGLE_CLIENT_SECRET - required for authorization code flow");
        console.error("[Google OAuth] Please set GOOGLE_CLIENT_SECRET in your server environment variables (.env.local)");
        return NextResponse.redirect(`${baseUrl}/auth/login?error=${encodeURIComponent("Server configuration error: GOOGLE_CLIENT_SECRET is required. Please add it to your .env.local file.")}`);
      }

      // Check if client secret looks like a client ID (common mistake)
      if (clientSecret === clientId || clientSecret.includes("apps.googleusercontent.com")) {
        console.error("[Google OAuth] ERROR: GOOGLE_CLIENT_SECRET appears to be set to the Client ID value!");
        console.error("[Google OAuth] The Client Secret is a DIFFERENT value from the Client ID.");
        console.error("[Google OAuth] Please get the Client Secret from Google Cloud Console:");
        console.error("[Google OAuth] 1. Go to Google Cloud Console > APIs & Services > Credentials");
        console.error("[Google OAuth] 2. Click on your OAuth 2.0 Client ID");
        console.error("[Google OAuth] 3. Copy the 'Client secret' (not the Client ID)");
        console.error("[Google OAuth] 4. Add it to .env.local as GOOGLE_CLIENT_SECRET=your_actual_secret");
        return NextResponse.redirect(`${baseUrl}/auth/login?error=${encodeURIComponent("Configuration Error: GOOGLE_CLIENT_SECRET is set incorrectly. It should be a different value from GOOGLE_CLIENT_ID. Please get the Client Secret from Google Cloud Console and update your .env.local file.")}`);
      }

      // Exchange authorization code for tokens
      try {
        console.log("[Google OAuth] Exchanging authorization code for tokens...");
        const tokenRequestParams = new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        });

        console.log("[Google OAuth] Token request params (secret hidden):", {
          code: code.substring(0, 20) + "...",
          client_id: clientId.substring(0, 20) + "...",
          client_secret: "***",
          redirect_uri: redirectUri,
          grant_type: "authorization_code"
        });

        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: tokenRequestParams,
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.text();
          let errorJson;
          try {
            errorJson = JSON.parse(errorData);
          } catch {
            errorJson = { error: errorData };
          }
          
          console.error("[Google OAuth] Token exchange failed:");
          console.error("[Google OAuth] Status:", tokenResponse.status);
          console.error("[Google OAuth] Error:", errorJson);
          
          if (errorJson.error === "invalid_client") {
            const errorMsg = "Invalid client credentials. Please verify that GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env.local file match your Google Cloud Console OAuth 2.0 Client ID credentials.";
            console.error("[Google OAuth]", errorMsg);
            return NextResponse.redirect(`${baseUrl}/auth/login?error=${encodeURIComponent(errorMsg)}`);
          }
          
          return NextResponse.redirect(`${baseUrl}/auth/login?error=${encodeURIComponent(`Failed to exchange authorization code: ${errorJson.error_description || errorJson.error || "Unknown error"}`)}`);
        }

        const tokenData = await tokenResponse.json();
        const receivedIdToken = tokenData.id_token;

        if (!receivedIdToken) {
          console.error("[Google OAuth] No id_token in token response");
          console.error("[Google OAuth] Token response:", JSON.stringify(tokenData, null, 2));
          return NextResponse.redirect(`${baseUrl}/auth/login?error=${encodeURIComponent("No ID token received from Google")}`);
        }

        // Verify the id_token
        googleUser = await verifyGoogleToken(receivedIdToken);
        if (!googleUser) {
          console.error("[Google OAuth] Token verification failed");
          return NextResponse.redirect(`${baseUrl}/auth/login?error=${encodeURIComponent("Invalid Google token")}`);
        }

        console.log("[Google OAuth] Token verified for user:", googleUser.email);
      } catch (tokenError) {
        console.error("[Google OAuth] Error exchanging code:", tokenError);
        return NextResponse.redirect(`${baseUrl}/auth/login?error=${encodeURIComponent("Failed to authenticate with Google")}`);
      }
    } else if (idToken) {
      // Fallback: Handle id_token flow (if token is in query params, though this is unusual)
      console.log("[Google OAuth] Processing id_token flow...");
      googleUser = await verifyGoogleToken(idToken);
      if (!googleUser) {
        console.error("[Google OAuth] Token verification failed");
        return NextResponse.redirect(`${baseUrl}/auth/login?error=${encodeURIComponent("Invalid Google token")}`);
      }
      console.log("[Google OAuth] Token verified for user:", googleUser.email);
    } else {
      console.error("[Google OAuth] Missing both code and id_token");
      console.error("[Google OAuth] All search params:", Object.fromEntries(searchParams.entries()));
      console.error("[Google OAuth] Full URL:", req.url);
      return NextResponse.redirect(`${baseUrl}/auth/login?error=${encodeURIComponent("Missing authentication data. Please ensure the redirect URI is correctly configured in Google Cloud Console.")}`);
    }

    if (!googleUser) {
      console.error("[Google OAuth] No Google user data available");
      return NextResponse.redirect(`${baseUrl}/auth/login?error=${encodeURIComponent("Failed to get user information from Google")}`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to authenticate with Google";
    console.error("Google OAuth GET error:", msg, e);
    return NextResponse.redirect(`${baseUrl}/auth/login?error=${encodeURIComponent(msg)}`);
  }
}

// Helper function to process Google user authentication
async function processGoogleUser(
  googleUser: { sub: string; email: string; email_verified: boolean; name?: string; picture?: string },
  role: "GUEST" | "HOST",
  baseUrl: string
) {
  try {
    console.log("[Google OAuth] Token verified for user:", googleUser.email);

    if (!googleUser.email_verified) {
      console.error("[Google OAuth] Email not verified");
      return NextResponse.redirect(`${baseUrl}/auth/login?error=${encodeURIComponent("Google email not verified")}`);
    }

    await connectMongo();

    console.log("[Google OAuth] Checking for existing user with email:", googleUser.email);
    
    // Check if user exists by Google ID or email
    const user = await User.findOne({
      $or: [
        { googleId: googleUser.sub },
        { email: googleUser.email.toLowerCase() }
      ]
    }).lean() as any;

    console.log("[Google OAuth] User found:", user ? `Yes (ID: ${user._id}, Role: ${user.role})` : "No (will create new)");

    let accessToken: string;
    let userRole: Role;
    let userId: string;
    let redirectTo: string;

    if (user) {
      // Existing user - login
      if (!user.googleId) {
        await User.updateOne({ _id: user._id }, { googleId: googleUser.sub });
      }

      if (user.status === "SUSPENDED") {
        return NextResponse.redirect(`${baseUrl}/auth/login?error=${encodeURIComponent("Account suspended")}`);
      }

      accessToken = await signAccessToken({
        sub: String(user._id),
        role: user.role
      });
      const refreshToken = await signRefreshToken(String(user._id));

      // Store refresh token in cookie
      const jar = await cookies();
      jar.set("refresh_token", refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30
      });

      const profileCheck = await checkProfileCompleteness(String(user._id), user.role);
      userRole = user.role;
      userId = String(user._id);
      redirectTo = profileCheck.complete 
        ? "/" 
        : userRole === "HOST" 
          ? `/hosts/${userId}/edit` 
          : "/profile";
    } else {
      // New user - register
      const userDoc = await User.create({
        email: googleUser.email.toLowerCase(),
        googleId: googleUser.sub,
        mobile: "",
        passwordHash: "",
        role: role,
        status: "PENDING"
      });

      if (role === "HOST") {
        const nameParts = (googleUser.name || "").split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";
        
        await HostProfile.create({
          userId: userDoc._id,
          firstName,
          lastName,
          name: googleUser.name || "",
          age: 0,
          interests: [],
          profileImagePath: googleUser.picture || ""
        });
      } else {
        const nameParts = (googleUser.name || "").split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";
        
        await GuestProfile.create({
          userId: userDoc._id,
          firstName,
          lastName,
          age: 0,
          gender: ""
        });
      }

      accessToken = await signAccessToken({
        sub: String(userDoc._id),
        role: role
      });
      const refreshToken = await signRefreshToken(String(userDoc._id));

      const jar = await cookies();
      jar.set("refresh_token", refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30
      });

      userId = String(userDoc._id);
      userRole = role;
      redirectTo = role === "HOST" ? `/hosts/${userId}/edit` : "/profile";
    }

    // Create redirect response with cookie set BEFORE redirect
    // Also pass token in URL as fallback (will be removed immediately after reading)
    const successUrl = `${baseUrl}/auth/google/success?redirect=${encodeURIComponent(redirectTo)}&role=${userRole}&token=${encodeURIComponent(accessToken)}`;
    
    // Create response and set cookie
    const response = NextResponse.redirect(successUrl);
    
    // Set cookie in the response headers directly
    response.cookies.set("google_auth_token", accessToken, {
      httpOnly: false, // Must be false for client-side JavaScript access
      sameSite: "lax", // Allow cross-site requests from same site
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      path: "/", // Available to all paths
      maxAge: 60 * 5 // 5 minutes
    });

    console.log("[Google OAuth] Token stored in cookie and URL");
    console.log("[Google OAuth] Token length:", accessToken.length);
    console.log("[Google OAuth] Redirecting to:", redirectTo);
    console.log("[Google OAuth] User role:", userRole);
    console.log("[Google OAuth] User ID:", userId);
    console.log("[Google OAuth] Success URL (token hidden):", successUrl.replace(accessToken, "***"));
    console.log("[Google OAuth] Cookie will be set with maxAge:", 60 * 5);
    
    return response;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to authenticate with Google";
    console.error("Google OAuth GET error:", msg, e);
    return NextResponse.redirect(`${baseUrl}/auth/login?error=${encodeURIComponent(msg)}`);
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    if (!json || !json.idToken || !json.role) {
      return badRequest("Missing idToken or role");
    }

    const { idToken, role } = json;
    
    if (role !== "GUEST" && role !== "HOST") {
      return badRequest("Invalid role. Must be GUEST or HOST");
    }

    // Verify Google token
    const googleUser = await verifyGoogleToken(idToken);
    if (!googleUser) {
      return badRequest("Invalid Google token");
    }

    if (!googleUser.email_verified) {
      return badRequest("Google email not verified");
    }

    await connectMongo();

    // Check if user exists by Google ID or email
    const user = await User.findOne({
      $or: [
        { googleId: googleUser.sub },
        { email: googleUser.email.toLowerCase() }
      ]
    }).lean() as any;

    if (user) {
      // Existing user - login
      // Update Google ID if not set
      if (!user.googleId) {
        await User.updateOne({ _id: user._id }, { googleId: googleUser.sub });
      }

      // Check if account is suspended
      if (user.status === "SUSPENDED") {
        return badRequest("Account suspended");
      }

      // Generate tokens
      const accessToken = await signAccessToken({
        sub: String(user._id),
        role: user.role
      });
      const refreshToken = await signRefreshToken(String(user._id));

      // Store refresh token in cookie
      const jar = await cookies();
      jar.set("refresh_token", refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30
      });

      // Check profile completeness
      const profileCheck = await checkProfileCompleteness(String(user._id), user.role);
      
      const userRole = user.role;
      const userId = String(user._id);
      const redirectTo = profileCheck.complete 
        ? "/" 
        : userRole === "HOST" 
          ? `/hosts/${userId}/edit` 
          : "/profile";

      return ok({
        accessToken,
        role: userRole,
        userId,
        profileComplete: profileCheck.complete,
        redirectTo
      });
    } else {
      // New user - register
      const userDoc = await User.create({
        email: googleUser.email.toLowerCase(),
        googleId: googleUser.sub,
        mobile: "", // Will be filled in profile
        passwordHash: "", // No password for Google users
        role: role,
        status: "PENDING"
      });

      // Create profile based on role
      if (role === "HOST") {
        const nameParts = (googleUser.name || "").split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";
        
        await HostProfile.create({
          userId: userDoc._id,
          firstName,
          lastName,
          name: googleUser.name || "",
          age: 0,
          interests: [],
          profileImagePath: googleUser.picture || ""
        });
      } else {
        const nameParts = (googleUser.name || "").split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";
        
        await GuestProfile.create({
          userId: userDoc._id,
          firstName,
          lastName,
          age: 0,
          gender: ""
        });
      }

      // Generate tokens
      const accessToken = await signAccessToken({
        sub: String(userDoc._id),
        role: role
      });
      const refreshToken = await signRefreshToken(String(userDoc._id));

      // Store refresh token in cookie
      const jar = await cookies();
      jar.set("refresh_token", refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30
      });

      // New users always need to complete profile
      const userId = String(userDoc._id);
      const redirectTo = role === "HOST" ? `/hosts/${userId}/edit` : "/profile";

      return ok({
        accessToken,
        role: role,
        userId,
        profileComplete: false,
        redirectTo
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to authenticate with Google";
    console.error("Google OAuth error:", msg, e);
    return serverError(msg);
  }
}
