# Token Key Fix - Rating Authentication Issue

## ❌ **THE PROBLEM**

Guest users were seeing this error even when logged in:
```
Cannot Rate Event
Please log in to rate this event
```

---

## 🔍 **ROOT CAUSE**

The rating page was using the **WRONG localStorage key** to retrieve the authentication token.

### **What Was Wrong:**
```javascript
// ❌ INCORRECT - This key doesn't exist!
const token = localStorage.getItem("dineathome_access_token");
```

### **What It Should Be:**
```javascript
// ✅ CORRECT - This is the actual key
const token = localStorage.getItem("dah_access_token");
```

**The application stores the token under `"dah_access_token"`, not `"dineathome_access_token"`!**

---

## ✅ **THE FIX**

Changed all token retrievals in the rating page to use the correct utility function:

```javascript
// Import the utility
import { getAccessToken } from "@/lib/session";

// Use it instead of direct localStorage
const token = getAccessToken();
```

### **Why Use `getAccessToken()`?**
1. **Correct key:** Uses `"dah_access_token"` internally
2. **Consistent:** Same method used throughout the app
3. **Safe:** Handles server-side rendering (SSR) gracefully
4. **Type-safe:** Returns `string | null` explicitly

---

## 📁 **FILES CHANGED**

### **File: `/src/app/events/[eventId]/rate/page.tsx`**

#### **Change 1: Added Import**
```typescript
// BEFORE
import { apiFetch } from "@/lib/http";

// AFTER
import { apiFetch } from "@/lib/http";
import { getAccessToken } from "@/lib/session";
```

#### **Change 2: Fixed `checkEligibility()`**
```typescript
// BEFORE
const token = localStorage.getItem("dineathome_access_token");

// AFTER
const token = getAccessToken();
```

#### **Change 3: Fixed `submitHostRating()`**
```typescript
// BEFORE
const token = localStorage.getItem("dineathome_access_token");

// AFTER
const token = getAccessToken();
```

#### **Change 4: Fixed `submitGuestRating()`**
```typescript
// BEFORE
const token = localStorage.getItem("dineathome_access_token");

// AFTER
const token = getAccessToken();
```

---

## 🔑 **HOW TOKEN STORAGE WORKS**

### **During Login:**
```typescript
// /src/lib/session.ts
const ACCESS_TOKEN_KEY = "dah_access_token";  // ← The actual key!

export function setSession(input: { accessToken: string; role: SessionRole }) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, input.accessToken);
  window.localStorage.setItem(ROLE_KEY, input.role);
}
```

**When user logs in:**
```
localStorage.setItem("dah_access_token", "eyJhbGciOiJ...");
localStorage.setItem("dah_role", "GUEST");
```

### **During Token Retrieval:**
```typescript
export function getAccessToken(): string | null {
  if (!hasWindow()) return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);  // "dah_access_token"
}
```

---

## 🧪 **HOW TO VERIFY FIX**

### **Method 1: Check Browser Console**

1. Open browser DevTools (F12)
2. Go to "Application" or "Storage" tab
3. Click "Local Storage"
4. Look for your domain
5. Check the keys:
   ```
   ✓ dah_access_token: "eyJhbGc..."
   ✓ dah_role: "GUEST"
   ```

### **Method 2: Console Commands**

Open browser console and type:
```javascript
// Check token
localStorage.getItem("dah_access_token");
// Should return: "eyJhbGc..."

// Check role
localStorage.getItem("dah_role");
// Should return: "GUEST"

// Old wrong key (should be null)
localStorage.getItem("dineathome_access_token");
// Returns: null (doesn't exist!)
```

---

## 📊 **BEFORE vs AFTER**

### **BEFORE (Broken):**
```
User logs in
  └─> Token stored as: "dah_access_token"
  
User visits rate page
  └─> Code tries to read: "dineathome_access_token"
  └─> Gets: null ❌
  └─> Shows error: "Please log in to rate this event"
```

### **AFTER (Fixed):**
```
User logs in
  └─> Token stored as: "dah_access_token"
  
User visits rate page
  └─> Code reads: "dah_access_token" (via getAccessToken())
  └─> Gets: "eyJhbGc..." ✅
  └─> Makes API call with token
  └─> Shows rating form! ✅
```

---

## 🎯 **OTHER PARTS ALREADY WORKING**

These pages were already using `getAccessToken()` correctly:

✅ Event booking page (`/events/[eventId]/page.tsx`)
✅ My bookings page (`/bookings/page.tsx`)
✅ Profile page (`/profile/page.tsx`)
✅ All other authenticated pages

**Only the rating page had the wrong key!**

---

## ⚠️ **IMPORTANT: Key Names**

The application uses **short key names** to save space in localStorage:

| Key Name | Full Name | Value |
|----------|-----------|-------|
| `dah_access_token` | DineAtHome Access Token | JWT string |
| `dah_role` | DineAtHome Role | "GUEST" / "HOST" / "ADMIN" |

**Always use the utility functions:**
- `getAccessToken()` - Get token
- `getRole()` - Get role
- `setSession()` - Set both
- `clearSession()` - Clear both

**Never hardcode key names!**

---

## 🚀 **TESTING**

### **Test 1: Login Check**
```
1. Login as guest user
2. Open DevTools → Application → Local Storage
3. Verify "dah_access_token" exists
4. Copy the token value
```

### **Test 2: Rating Page**
```
1. Stay logged in
2. Go to any event's rating page
3. Should NOT see "Please log in" error
4. Should see rating form (if event is complete)
```

### **Test 3: Token in Request**
```
1. Open DevTools → Network tab
2. Go to rating page
3. Look for API call to /api/feedback/check-eligibility
4. Check Request Headers
5. Should see: Authorization: Bearer eyJhbGc...
```

---

## ✅ **BUILD STATUS**

```
✅ TypeScript: PASSING
✅ Token retrieval: FIXED
✅ All three functions updated: checkEligibility, submitHostRating, submitGuestRating
✅ Consistent with rest of application
✅ Ready for testing!
```

---

## 📝 **SUMMARY**

**Problem:** Wrong localStorage key (`"dineathome_access_token"` instead of `"dah_access_token"`)

**Fix:** Use `getAccessToken()` utility function

**Result:** Guest users can now rate events when logged in!

---

**The rating feature should now work perfectly for all logged-in guest users!** Just make sure:
1. User is logged in as GUEST
2. Event has already ended (past end time)
3. User has a booking for that event
