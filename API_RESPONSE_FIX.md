# API Response Structure Fix

## ❌ **THE PROBLEM**

Error: **"Cannot read properties of null (reading 'canRate')"**

This error occurred because the API response structure didn't match what the frontend expected.

---

## 🔍 **ROOT CAUSE**

### **How `apiFetch` Works:**
```typescript
// /src/lib/http.ts
export async function apiFetch<T>(path: string, opts?: RequestInit) {
  const res = await fetch(path, opts);
  const json = await res.json();
  
  if (!res.ok) {
    return { ok: false, error: json?.error };
  }
  
  // Expects response to have a "data" field!
  return { ok: true, data: json?.data };
}
```

**The utility expects ALL successful responses to have this structure:**
```json
{
  "data": { ... }
}
```

---

### **What the API Was Returning:**

#### **Before (WRONG):**
```javascript
// API returned this directly
return NextResponse.json({
  canRate: false,
  reason: "Event not yet completed"
});

// Frontend tried to access: response.data.canRate
// But response.data was NULL! ❌
```

#### **After (CORRECT):**
```javascript
// API now wraps in "data"
return NextResponse.json({
  data: {
    canRate: false,
    reason: "Event not yet completed"
  }
});

// Frontend accesses: response.data.canRate
// Works! ✅
```

---

## ✅ **THE FIX**

### **File: `/src/app/api/feedback/check-eligibility/route.ts`**

#### **Change 1: When User Cannot Rate**
```typescript
// BEFORE
if (!eligibility.canRate) {
  return NextResponse.json({ 
    canRate: false, 
    reason: eligibility.reason 
  });
}

// AFTER
if (!eligibility.canRate) {
  return NextResponse.json({ 
    data: {
      canRate: false, 
      reason: eligibility.reason 
    }
  });
}
```

#### **Change 2: When User Can Rate**
```typescript
// BEFORE
return NextResponse.json({
  canRate: true,
  bookingId: eligibility.bookingId,
  host,
  coGuests
});

// AFTER
return NextResponse.json({
  data: {
    canRate: true,
    bookingId: eligibility.bookingId,
    host,
    coGuests
  }
});
```

---

## 🔄 **REQUEST/RESPONSE FLOW**

### **Complete Flow:**

```
┌─────────────────┐
│   Frontend      │
│   rate/page.tsx │
└────────┬────────┘
         │
         │ 1. Call API
         │
         ▼
   apiFetch("/api/feedback/check-eligibility")
         │
         │ 2. Fetch request
         │
         ▼
┌─────────────────────────┐
│   Backend API           │
│   check-eligibility     │
└────────┬────────────────┘
         │
         │ 3. Check eligibility
         │
         ▼
   canRateEvent(userId, eventId)
         │
         │ 4. Return result
         │
         ▼
┌─────────────────────────┐
│   Response (JSON)       │
│   {                     │
│     data: {             │
│       canRate: true,    │
│       bookingId: "...", │
│       host: {...},      │
│       coGuests: [...]   │
│     }                   │
│   }                     │
└────────┬────────────────┘
         │
         │ 5. Parse response
         │
         ▼
   apiFetch returns: { ok: true, data: {...} }
         │
         │ 6. Frontend uses
         │
         ▼
   setEligibility(res.data)
   // res.data.canRate ✅ Works!
```

---

## 📊 **BEFORE vs AFTER**

### **BEFORE (Broken):**
```
API Response:
{
  canRate: false,
  reason: "Event not yet completed"
}

apiFetch processing:
  json.data = undefined
  Returns: { ok: true, data: null }

Frontend:
  res.data = null
  res.data.canRate → ERROR! ❌
  "Cannot read properties of null (reading 'canRate')"
```

### **AFTER (Fixed):**
```
API Response:
{
  data: {
    canRate: false,
    reason: "Event not yet completed"
  }
}

apiFetch processing:
  json.data = { canRate: false, reason: "..." }
  Returns: { ok: true, data: { canRate: false, ... } }

Frontend:
  res.data = { canRate: false, reason: "..." }
  res.data.canRate → false ✅
  Shows error message: "Event not yet completed"
```

---

## 🎯 **WHY THIS PATTERN?**

### **Consistent Response Structure:**
All API endpoints in the app follow this pattern:

```javascript
// Success response
{
  data: { ... }
}

// Error response
{
  error: "Error message"
}
```

**Benefits:**
1. ✅ Consistent across all APIs
2. ✅ Type-safe with TypeScript
3. ✅ Easy to handle in frontend
4. ✅ Clear separation of data and errors

---

## 🧪 **OTHER APIS ALREADY USING THIS:**

These APIs were already correct:

✅ `/api/me` → Returns `{ data: { userId, email, ... } }`
✅ `/api/events/[eventId]` → Returns `{ data: { id, title, ... } }`
✅ `/api/guest/bookings` → Returns `{ data: { bookingId, ... } }`

**Only the feedback API was missing the wrapper!**

---

## ✅ **WHAT NOW WORKS**

### **Scenario 1: Event Not Completed**
```
API Response:
{
  data: {
    canRate: false,
    reason: "Event not yet completed"
  }
}

Frontend Shows:
"Cannot Rate Event
Event not yet completed"
```

### **Scenario 2: No Booking Found**
```
API Response:
{
  data: {
    canRate: false,
    reason: "No booking found for this event"
  }
}

Frontend Shows:
"Cannot Rate Event
No booking found for this event"
```

### **Scenario 3: Can Rate**
```
API Response:
{
  data: {
    canRate: true,
    bookingId: "abc123",
    host: { userId: "...", hostName: "John", ... },
    coGuests: [...]
  }
}

Frontend Shows:
Rating form with host and co-guest sections! ✅
```

---

## 🚀 **TESTING**

### **Test 1: Future Event**
1. Create event for tomorrow
2. Book as guest
3. Try to rate
4. Should show: **"Event not yet completed"** ✅

### **Test 2: Past Event, No Booking**
1. Create event for yesterday
2. DON'T book it
3. Try to rate
4. Should show: **"No booking found for this event"** ✅

### **Test 3: Past Event, Has Booking**
1. Create event for yesterday
2. Book as guest
3. Try to rate
4. Should show: **Rating form with stars!** ✅

---

## ✅ **BUILD STATUS**
```
✅ TypeScript: PASSING
✅ API Response: FIXED
✅ Response structure: CONSISTENT
✅ Error handling: WORKING
✅ Ready for testing!
```

---

## 📝 **SUMMARY**

**Problem:** API returned data without wrapping in `data` field

**Fix:** Wrapped both success and error responses in `data` object

**Result:** Frontend can now properly access response data!

---

**The rating feature should now work! Try it again with a past event you've booked.**
