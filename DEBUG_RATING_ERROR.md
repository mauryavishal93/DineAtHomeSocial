# Debug Rating Error - Step by Step Guide

## 🔍 **HOW TO SEE WHAT'S WRONG**

I've added detailed logging to help identify the exact issue. Follow these steps:

---

## **STEP 1: Open Browser Console**

1. Open your browser (Chrome/Firefox/Safari)
2. Press **F12** (or right-click → Inspect)
3. Click the **"Console"** tab
4. Clear any old messages (click the 🚫 icon)

---

## **STEP 2: Try to Rate the Event**

1. Make sure you're logged in as a **Guest** user
2. Go to the event's rating page: `/events/[eventId]/rate`
3. Watch the console for messages

---

## **STEP 3: Check Console Output**

You should see logs like this:

### **✅ If Working:**
```
Checking eligibility for event: 67890abc...
Token exists: true
Eligibility response: { ok: true, data: { canRate: true, ... } }
```

### **❌ If Failing - You'll See One of These:**

#### **Error 1: Event Not Completed**
```
Eligibility response: { 
  ok: true, 
  data: { 
    canRate: false, 
    reason: "Event not yet completed" 
  } 
}
```
**Solution:** The event hasn't ended yet. Create an event with a past end time.

---

#### **Error 2: No Booking Found**
```
Eligibility response: { 
  ok: true, 
  data: { 
    canRate: false, 
    reason: "No booking found for this event" 
  } 
}
```
**Solution:** You haven't booked this event. Book it first as a guest.

---

#### **Error 3: API Error**
```
Eligibility response: { 
  ok: false, 
  error: "Unauthorized" 
}
```
**Solution:** Token is invalid. Log out and log back in.

---

#### **Error 4: Network Error**
```
Exception in checkEligibility: Failed to fetch
```
**Solution:** Server is not running. Start it with `node server.js`

---

## **STEP 4: Check Server Logs**

If you're running the server in terminal, you'll see detailed logs:

### **✅ Successful Request:**
```
[Eligibility API] Starting eligibility check
[Eligibility API] User authenticated: 12345 GUEST
[Eligibility API] Event ID: 67890
[Eligibility API] Checking if user can rate event
[Eligibility API] Eligibility result: { canRate: true, bookingId: "abc123" }
[Eligibility API] Fetching host and co-guests
[Eligibility API] Host: { userId: "...", hostName: "John", ... }
[Eligibility API] Co-guests count: 2
```

### **❌ Failed Request:**
```
[Eligibility API] Starting eligibility check
[Eligibility API] Error: CastError: Cast to ObjectId failed
[Eligibility API] Error message: Cast to ObjectId failed for value "undefined"
```
**Solution:** Invalid event ID. Check the URL.

---

## **COMMON ISSUES & SOLUTIONS**

### **Issue 1: "Event not yet completed"**
**Reason:** Event end time is in the future

**Check:**
```sql
-- In MongoDB
db.eventslots.findOne({ _id: ObjectId("YOUR_EVENT_ID") })

-- Look at "endAt" field
// Example: "endAt": "2026-01-18T14:00:00Z"
// Current time: 2026-01-17 (event not done yet!)
```

**Fix:**
Create an event with **past dates**:
- Start: Yesterday 10 AM
- End: Yesterday 2 PM

---

### **Issue 2: "No booking found"**
**Reason:** You didn't book this event

**Check:**
```sql
-- In MongoDB
db.bookings.find({ 
  guestUserId: "YOUR_USER_ID",
  eventSlotId: "YOUR_EVENT_ID"
})

-- Should return at least one booking
```

**Fix:**
1. Go to the event page
2. Book 1-3 seats
3. Then try rating again

---

### **Issue 3: Wrong Event ID**
**Reason:** Invalid or non-existent event ID in URL

**Check the URL:**
```
✅ Correct: /events/67890abc123def456/rate
❌ Wrong: /events/undefined/rate
❌ Wrong: /events/null/rate
```

**Fix:**
- Go to "Events" page
- Click on a specific event
- Then click "Rate Event" button

---

### **Issue 4: Token Issues**
**Reason:** Not logged in or session expired

**Check localStorage:**
```javascript
// In browser console
localStorage.getItem("dah_access_token")
// Should return: "eyJhbGc..."

localStorage.getItem("dah_role")
// Should return: "GUEST"
```

**Fix:**
- Log out
- Log back in as Guest
- Try rating again

---

## **STEP 5: Share the Logs**

If you still can't identify the issue, share:

1. **Browser console output** (screenshot or copy text)
2. **Server terminal output** (copy the [Eligibility API] logs)
3. **Event details:**
   - Event ID
   - Event start/end times
   - Current time
4. **User details:**
   - Role (GUEST/HOST)
   - Have you booked this event?

---

## **QUICK DIAGNOSTIC COMMANDS**

Open browser console and run:

```javascript
// 1. Check if logged in
console.log("Token:", localStorage.getItem("dah_access_token"));
console.log("Role:", localStorage.getItem("dah_role"));

// 2. Check current page
console.log("Current URL:", window.location.href);
console.log("Event ID:", window.location.pathname.split('/')[2]);

// 3. Make test API call
fetch('/api/me', {
  headers: {
    'authorization': `Bearer ${localStorage.getItem("dah_access_token")}`
  }
})
.then(r => r.json())
.then(data => console.log("User data:", data));
```

---

## **TESTING CHECKLIST**

Before trying to rate, verify:

- [ ] ✅ Logged in as **GUEST** user
- [ ] ✅ Event **start time** is in the **past**
- [ ] ✅ Event **end time** is in the **past**
- [ ] ✅ You have **booked** this event
- [ ] ✅ Booking status is **CONFIRMED** or **PAYMENT_PENDING**
- [ ] ✅ Event ID in URL is **valid** (not undefined/null)
- [ ] ✅ Server is **running** (`node server.js`)
- [ ] ✅ Database is **connected** (MongoDB running)

---

## **BUILD STATUS**
✅ Enhanced logging deployed
✅ Both frontend and backend logs active
✅ Ready for debugging

---

**Now try rating the event again and check the console/server logs!**
