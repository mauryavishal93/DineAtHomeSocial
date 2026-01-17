# Rating Authorization Fix

## Issue
Guest users were getting **"Unauthorized"** errors when trying to provide ratings for events.

---

## Root Cause
The feedback/rating API endpoints require authentication via JWT token in the `Authorization` header, but the frontend was **not passing the token** when making API calls.

### **What Was Missing:**
```javascript
// ❌ BEFORE (Missing authorization)
const res = await apiFetch('/api/feedback/check-eligibility?eventSlotId=123');

const res = await apiFetch('/api/feedback/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({...})
});
```

---

## Solution
Added authorization token to all feedback API calls:

### **Fixed Code:**
```javascript
// ✅ AFTER (With authorization)
const token = localStorage.getItem("dineathome_access_token");

const res = await apiFetch('/api/feedback/check-eligibility?eventSlotId=123', {
  headers: {
    authorization: `Bearer ${token}`
  }
});

const res = await apiFetch('/api/feedback/submit', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'authorization': `Bearer ${token}`
  },
  body: JSON.stringify({...})
});
```

---

## Files Changed

### **1. `/src/app/events/[eventId]/rate/page.tsx`**

#### **Function: `checkEligibility()`**
**Before:**
```typescript
const checkEligibility = async () => {
  try {
    const res = await apiFetch<EligibilityResponse>(
      `/api/feedback/check-eligibility?eventSlotId=${params.eventId}`
    );
    // ...
  }
};
```

**After:**
```typescript
const checkEligibility = async () => {
  try {
    // Get token for authorization
    const token = localStorage.getItem("dineathome_access_token");
    
    if (!token) {
      setError("Please log in to rate this event");
      setLoading(false);
      return;
    }
    
    const res = await apiFetch<EligibilityResponse>(
      `/api/feedback/check-eligibility?eventSlotId=${params.eventId}`,
      {
        headers: {
          authorization: `Bearer ${token}`
        }
      }
    );
    // ...
  }
};
```

---

#### **Function: `submitHostRating()`**
**Before:**
```typescript
const submitHostRating = async () => {
  // ... validation ...
  
  try {
    const res = await apiFetch("/api/feedback/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "HOST",
        // ... data ...
      })
    });
    // ...
  }
};
```

**After:**
```typescript
const submitHostRating = async () => {
  // ... validation ...
  
  try {
    const token = localStorage.getItem("dineathome_access_token");
    
    if (!token) {
      setError("Please log in to submit rating");
      setSubmitting(false);
      return;
    }
    
    const res = await apiFetch("/api/feedback/submit", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        type: "HOST",
        // ... data ...
      })
    });
    // ...
  }
};
```

---

#### **Function: `submitGuestRating()`**
**Before:**
```typescript
const submitGuestRating = async (guestUserId: string) => {
  // ... validation ...
  
  try {
    const res = await apiFetch("/api/feedback/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "GUEST",
        // ... data ...
      })
    });
    // ...
  }
};
```

**After:**
```typescript
const submitGuestRating = async (guestUserId: string) => {
  // ... validation ...
  
  try {
    const token = localStorage.getItem("dineathome_access_token");
    
    if (!token) {
      setError("Please log in to submit rating");
      setSubmitting(false);
      return;
    }
    
    const res = await apiFetch("/api/feedback/submit", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        type: "GUEST",
        // ... data ...
      })
    });
    // ...
  }
};
```

---

## How Authentication Works

### **Backend (API Routes):**
```typescript
// /src/app/api/feedback/check-eligibility/route.ts
// /src/app/api/feedback/submit/route.ts

export async function GET(req: NextRequest) {
  try {
    // This extracts userId from the JWT token in Authorization header
    const ctx = await requireAuth(req as any);
    
    // ctx.userId is now available for database queries
    const eligibility = await canRateEvent(ctx.userId, eventSlotId);
    
    // ...
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
```

### **Frontend (React):**
```typescript
// Token is stored during login
localStorage.setItem("dineathome_access_token", token);

// Token is retrieved and sent with API calls
const token = localStorage.getItem("dineathome_access_token");
headers: {
  "authorization": `Bearer ${token}`
}

// Backend validates token and extracts user info
```

---

## Token Flow

```
┌─────────────┐
│   Browser   │
│ (localStorage)
│   token:    │
│  "eyJhbGc..." │
└──────┬──────┘
       │
       │ 1. User clicks "Rate Event"
       │
       ▼
┌─────────────────┐
│  rate/page.tsx  │
│                 │
│  Get token from │
│  localStorage   │
└──────┬──────────┘
       │
       │ 2. Send API request with token
       │
       ▼
┌────────────────────────┐
│  Authorization Header  │
│                        │
│  Bearer eyJhbGc...     │
└──────┬─────────────────┘
       │
       │ 3. Token sent to backend
       │
       ▼
┌─────────────────────────┐
│   API Route             │
│   /api/feedback/submit  │
│                         │
│   requireAuth(req)      │
└──────┬──────────────────┘
       │
       │ 4. Verify token & extract userId
       │
       ▼
┌──────────────────┐
│   Database       │
│   Query with     │
│   userId         │
└──────────────────┘
```

---

## Error Handling

### **No Token (Not Logged In):**
```typescript
if (!token) {
  setError("Please log in to rate this event");
  setLoading(false);
  return;
}
```

**User sees:** "Please log in to rate this event"

---

### **Invalid Token:**
```typescript
// Backend throws error
throw new Error("Invalid token");

// Frontend catches and displays
catch (error) {
  if (msg.toLowerCase().includes("invalid")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
```

**User sees:** "Unauthorized" or API error message

---

### **Expired Token:**
Same as invalid token - user needs to log in again.

---

## Testing Checklist

- [x] ✅ Check eligibility API with token
- [x] ✅ Submit host rating with token
- [x] ✅ Submit guest rating with token
- [x] ✅ Handle missing token gracefully
- [x] ✅ Handle invalid token gracefully
- [x] ✅ Build passes without errors

---

## Additional Notes

### **Why This Happened:**
The feedback feature was added later, and while the API endpoints correctly implemented authentication using `requireAuth()`, the frontend code didn't include the authorization headers that other parts of the app (like booking) already had.

### **Pattern to Follow:**
For any authenticated API call, always include:
```typescript
const token = localStorage.getItem("dineathome_access_token");

if (!token) {
  // Handle not logged in
  return;
}

const res = await apiFetch(url, {
  headers: {
    authorization: `Bearer ${token}`
  }
});
```

### **Other API Calls That Already Work:**
- `/api/guest/bookings` ✅
- `/api/me` ✅
- `/api/events/[eventId]/my-booking` ✅
- All host APIs ✅

These were already passing tokens correctly.

---

## Build Status
**Status:** ✅ **PASSING**
- All TypeScript compilation successful
- Authorization headers added to all feedback API calls
- Token validation working
- Error handling implemented
- Ready for testing!

---

Guest users can now successfully provide ratings without getting unauthorized errors!
