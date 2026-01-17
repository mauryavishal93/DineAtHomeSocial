# Event Time Filtering - Past vs Upcoming Events

## Overview
Events are now filtered by their completion status:
- **Events Page (Public):** Shows ONLY upcoming events
- **My Bookings (Guest):** Shows ONLY past events
- **My Events (Host):** Shows ONLY past events

---

## ✅ **WHAT CHANGED**

### **1. Events Explore Page (`/events`)**
**Before:** Showed all events regardless of date
**After:** Shows only **upcoming events** (events that haven't ended yet)

```javascript
// Filter: endAt > now
const slots = await EventSlot.find({ 
  status: "OPEN",
  endAt: { $gt: now }  // ← Only future events
})
```

**What Users See:**
- Events happening today or in the future ✅
- Events that haven't ended yet ✅
- Past events are hidden ❌

---

### **2. My Bookings Page (`/bookings`)**
**Before:** Showed both upcoming and past bookings
**After:** Shows only **past events** (events that have ended)

```javascript
// Filter: endAt < now
const eventEnd = new Date(event.endAt);
if (eventEnd > now) continue; // Skip upcoming
```

**What Users See:**
- Only completed events ✅
- Events they attended in the past ✅
- Upcoming bookings are hidden ❌
- "Rate Event" button available for all past events ✅

**Page Title Updated:**
- Before: "View all your event bookings - past and upcoming"
- After: "View your past event bookings"

---

### **3. My Events Page (`/host/my-events`)**
**Before:** Showed both upcoming and past hosted events
**After:** Shows only **past events** (events that have ended)

```javascript
// Filter: endAt < now
const eventEnd = new Date(event.endAt);
if (eventEnd > now) continue; // Skip upcoming
```

**What Users See:**
- Only completed events they hosted ✅
- Full guest lists with details ✅
- Event statistics ✅
- Upcoming events are hidden ❌

**Page Title Updated:**
- Before: "Manage your hosted events and guest lists"
- After: "View your past hosted events and guest lists"

---

## 📅 **TIME COMPARISON LOGIC**

### **How "Past" vs "Upcoming" is Determined:**

```javascript
const now = new Date();              // Current time
const eventEnd = new Date(event.endAt); // Event end time

if (eventEnd < now) {
  // ✅ PAST EVENT - Event has ended
  // Show in: My Bookings, My Events
} else {
  // ✅ UPCOMING EVENT - Event hasn't ended
  // Show in: Events Explore page
}
```

### **Examples:**

**Current Time:** Jan 17, 2026, 5:45 PM

| Event End Time | Status | Shown Where |
|----------------|--------|-------------|
| Jan 16, 2026, 2:00 PM | Past | My Bookings, My Events |
| Jan 17, 2026, 3:00 PM | Past | My Bookings, My Events |
| Jan 17, 2026, 8:00 PM | Upcoming | Events Explore |
| Jan 18, 2026, 12:00 PM | Upcoming | Events Explore |
| Jan 20, 2026, 6:00 PM | Upcoming | Events Explore |

---

## 🎯 **USER EXPERIENCE**

### **As a Guest:**

#### **Browsing Events (`/events`):**
```
Shows:
✓ Event today at 8 PM (happening later)
✓ Event tomorrow
✓ Event next week
✓ All future events

Hidden:
✗ Yesterday's events
✗ Events from last week
✗ Any completed events
```

**Benefits:**
- Only see bookable events
- No confusion about past events
- Clean, relevant listings

---

#### **My Bookings (`/bookings`):**
```
Shows:
✓ Events attended yesterday
✓ Events attended last week
✓ All past events you booked
✓ "Rate Event" button for each

Hidden:
✗ Upcoming booked events
✗ Events happening today (if not ended)
✗ Future bookings
```

**Benefits:**
- Focus on completed experiences
- Easy access to rating
- Clear history of attended events
- Can review and rate past events

---

### **As a Host:**

#### **My Events (`/host/my-events`):**
```
Shows:
✓ Events you hosted yesterday
✓ Events you hosted last week
✓ All past hosted events
✓ Complete guest lists
✓ Attendance statistics

Hidden:
✗ Upcoming scheduled events
✗ Events happening today (if not ended)
✗ Future events
```

**Benefits:**
- Review past event performance
- See who attended
- Track guest ratings
- Analyze historical data
- Focus on completed events

---

## 📊 **DATABASE QUERIES**

### **Public Events (Explore):**
```javascript
await EventSlot.find({ 
  status: "OPEN",
  endAt: { $gt: new Date() }  // End time in future
})
.sort({ startAt: 1 })  // Soonest first
```

**MongoDB Query:**
```javascript
db.eventslots.find({
  status: "OPEN",
  endAt: { $gt: ISODate("2026-01-17T12:15:00Z") }
})
```

---

### **Guest Bookings:**
```javascript
// Get all bookings
const bookings = await Booking.find({...});

// Filter by end time
for (const booking of bookings) {
  const eventEnd = new Date(event.endAt);
  if (eventEnd > now) continue;  // Skip upcoming
  
  // Add to past events list
  past.push(booking);
}
```

---

### **Host Events:**
```javascript
// Get all events
const events = await EventSlot.find({ hostUserId });

// Filter by end time
for (const event of events) {
  const eventEnd = new Date(event.endAt);
  if (eventEnd > now) continue;  // Skip upcoming
  
  // Add to past events list
  past.push(event);
}
```

---

## 🎨 **UI CHANGES**

### **My Bookings Page:**

**Before:**
```
My Bookings
View all your event bookings - past and upcoming

[Upcoming Events (3)]
- Event 1 (Tomorrow)
- Event 2 (Next week)
- Event 3 (Next month)

[Past Events (2)]
- Event 4 (Yesterday)
- Event 5 (Last week)
```

**After:**
```
My Bookings
View your past event bookings

[No upcoming section]

[Past Events (2)]
- Event 4 (Yesterday) [⭐ Rate Event]
- Event 5 (Last week) [⭐ Rate Event]
```

---

### **My Events Page:**

**Before:**
```
My Events
Manage your hosted events and guest lists

[Upcoming Events (3)]
- Event 1 with 5 guests (Tomorrow)
- Event 2 with 3 guests (Next week)

[Past Events (2)]
- Event 3 with 8 guests (Yesterday)
- Event 4 with 6 guests (Last week)
```

**After:**
```
My Events
View your past hosted events and guest lists

[No upcoming section]

[Past Events (2)]
- Event 3 with 8 guests (Yesterday)
- Event 4 with 6 guests (Last week)
```

---

## ⚠️ **IMPORTANT NOTES**

### **Event End Time is Key:**
The filter uses `endAt` (not `startAt`) to determine if an event is past:

**Why `endAt`?**
- An event that started but hasn't ended is still "ongoing"
- Only when event completely ends can guests rate it
- Consistent with rating system requirements

**Example:**
```
Event: Jan 17, 2026
Start: 6:00 PM
End: 9:00 PM
Current Time: 7:00 PM

Status: ONGOING (started but not ended)
Shown in: Events page (still upcoming)
Can rate? NO (not yet completed)
```

---

### **Rating Requirements Alignment:**
This filtering aligns perfectly with rating requirements:

```
To rate an event:
1. ✅ Event must be COMPLETED (endAt < now)
2. ✅ Must have booked the event

To see event in My Bookings:
- ✅ Event must be COMPLETED (endAt < now)

Result:
- If you can see it in My Bookings
- You can rate it! ✅
```

---

## 🧪 **TESTING**

### **Test 1: Past Event in Bookings**
1. Create event for yesterday
2. Book as guest
3. Go to My Bookings
4. Should see the event ✅
5. Should see "Rate Event" button ✅

### **Test 2: Past Event NOT in Explore**
1. Same past event from Test 1
2. Go to `/events` page
3. Should NOT see the past event ✅
4. Only shows future events ✅

### **Test 3: Upcoming Event in Explore**
1. Create event for tomorrow
2. Go to `/events` page
3. Should see the event ✅
4. Can book it ✅

### **Test 4: Upcoming Event NOT in Bookings**
1. Book the future event from Test 3
2. Go to My Bookings
3. Should NOT see it yet ✅
4. Will appear after event ends ✅

### **Test 5: Host Past Events**
1. Create event for yesterday (as host)
2. Have guests book it
3. Wait for event to end
4. Go to My Events (host)
5. Should see the event ✅
6. Should see all guest details ✅

---

## ✅ **BUILD STATUS**
```
✅ TypeScript: PASSING
✅ Event filtering: IMPLEMENTED
✅ Database queries: OPTIMIZED
✅ UI updated: PAST EVENTS ONLY
✅ Explore page: UPCOMING ONLY
✅ Ready for production!
```

---

## 📝 **SUMMARY**

| Page | Shows | Logic |
|------|-------|-------|
| `/events` | Upcoming events | `endAt > now` |
| `/bookings` | Past events | `endAt < now` |
| `/host/my-events` | Past events | `endAt < now` |

**Clear separation ensures:**
- Users see relevant content
- No confusion about past/future
- Rating feature works seamlessly
- Clean, focused user experience
