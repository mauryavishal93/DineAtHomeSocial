# Google OAuth Setup Guide

This guide will help you set up Google Sign-In for the DineAtHome Social application.

## Prerequisites

- A Google Cloud Platform (GCP) account
- Access to Google Cloud Console

## Step 1: Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen first:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in the required information (App name, User support email, Developer contact)
   - Add scopes: `openid`, `email`, `profile`
   - Add test users if your app is in testing mode

## Step 2: Configure OAuth Client

1. Choose **Web application** as the application type
2. Give it a name (e.g., "DineAtHome Social Web Client")
3. **IMPORTANT: Add Authorized redirect URIs:**

   For **Development (localhost)**:
   ```
   http://localhost:3000/api/auth/google/callback
   ```

   For **Production** (replace with your actual domain):
   ```
   https://yourdomain.com/api/auth/google/callback
   ```

   **Note:** The redirect URI must match EXACTLY, including:
   - The protocol (`http://` for localhost, `https://` for production)
   - The domain (no trailing slashes)
   - The exact path (`/api/auth/google/callback`)

4. Click **Create**
5. Copy the **Client ID** (you'll need this for your `.env` file)

## Step 3: Configure Environment Variables

Add the following to your `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com

# Optional: Set your app URL (for production)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**Important Notes:**
- Use the same Client ID for both `GOOGLE_CLIENT_ID` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- The `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is used by the client-side code
- The `GOOGLE_CLIENT_ID` is used by the server-side code for token verification
- `NEXT_PUBLIC_APP_URL` is optional but recommended for production

## Step 4: Verify Redirect URI Configuration

The redirect URI used by the application is:
```
{window.location.origin}/api/auth/google/callback
```

This means:
- **Development:** `http://localhost:3000/api/auth/google/callback`
- **Production:** `https://yourdomain.com/api/auth/google/callback`

Make sure these exact URIs are added in Google Cloud Console.

## Troubleshooting

### Error: `redirect_uri_mismatch`

This error occurs when the redirect URI in your request doesn't match what's configured in Google Cloud Console.

**Solution:**
1. Check the exact redirect URI being used:
   - Open browser console and look for the OAuth URL
   - Or check the network tab when clicking "Sign in with Google"
   
2. Verify in Google Cloud Console:
   - Go to **APIs & Services** > **Credentials**
   - Click on your OAuth 2.0 Client ID
   - Check the **Authorized redirect URIs** section
   - Ensure the exact URI (including protocol, domain, and path) is listed

3. Common issues:
   - Missing `http://` or `https://` prefix
   - Trailing slashes
   - Wrong port number (should be `:3000` for localhost)
   - Wrong path (should be `/api/auth/google/callback`)

### Error: `invalid_client`

This means the Client ID is incorrect or not found.

**Solution:**
- Verify your Client ID in `.env` matches the one in Google Cloud Console
- Make sure there are no extra spaces or characters
- Restart your development server after changing `.env`

### Testing in Production

When deploying to production:
1. Add your production redirect URI to Google Cloud Console
2. Update `NEXT_PUBLIC_APP_URL` in your production environment variables
3. Ensure your production domain matches exactly

## Security Notes

- Never commit your `.env` file to version control
- Use different OAuth credentials for development and production
- Keep your Client Secret secure (though it's not needed for this implementation)
- Regularly review and rotate credentials

## How It Works

1. User clicks "Sign in with Google as Host/Guest"
2. Application redirects to Google OAuth with:
   - `client_id`: Your Google Client ID
   - `redirect_uri`: `{your-domain}/api/auth/google/callback`
   - `response_type`: `id_token`
   - `scope`: `openid email profile`
   - `state`: The user's role (GUEST or HOST)

3. Google authenticates the user and redirects back with an ID token
4. Backend verifies the token and creates/logs in the user
5. User is redirected to the appropriate page based on profile completeness
