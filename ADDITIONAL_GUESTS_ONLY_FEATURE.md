# Additional Guests Only Feature

## Overview
When a user has already booked 1 seat for themselves, subsequent bookings for the same event can only be for **additional guests** (not for themselves again). This prevents duplicate primary bookings and ensures proper guest tracking.

---

## ✅ **KEY RULES**

### **1. First Booking (No Existing Booking):**
- User books **1-3 seats** total
- First seat = **Primary guest** (the user themselves)
- Additional seats (if any) = **Additional guests** (friends/family)
- Example: 
  - 1 seat: User only
  - 2 seats: User + 1 guest
  - 3 seats: User + 2 guests

### **2. Subsequent Bookings (Has Existing Booking):**
- User can book **up to 2 MORE seats**
- ALL new seats = **Additional guests ONLY**
- User is NOT listed as primary again
- Example:
  - Already booked 1 seat (user)
  - Can book 2 more seats → Both must be additional guests
  - Total: 1 (user) + 2 (guests) = 3 seats maximum

### **3. Maximum Limit:**
- **3 seats total** per event per user
- **1 seat for user** (primary)
- **2 seats for guests** (additional)

---

## 🎯 **USER SCENARIOS**

### **Scenario 1: First Booking - 1 Seat (User Only)**
```
User visits Event Page (no existing booking)
└─> Shows: "Booking as: John Doe"
└─> Dropdown: [1 seat] [2 seats] [3 seats]
└─> Helper: "Maximum 3 seats per booking (yourself + 2 guests)"
└─> User selects: 1 seat
└─> No additional guest details needed
└─> Clicks "Book"
└─> ✅ Booked 1 seat

Database:
{
  seats: 1,
  guestName: "John Doe",
  guestMobile: "9876543210",
  additionalGuests: []
}
```

**Result:** User has booked themselves, can add 2 more guests later.

---

### **Scenario 2: First Booking - 3 Seats (User + 2 Guests)**
```
User visits Event Page (no existing booking)
└─> Shows: "Booking as: John Doe"
└─> Dropdown: [1 seat] [2 seats] [3 seats]
└─> User selects: 3 seats
└─> Shows "Additional Guests (0 of 2 added)"
└─> User adds Guest #2: Jane Smith
└─> User adds Guest #3: Bob Wilson
└─> Clicks "Book"
└─> ✅ Booked 3 seats

Database:
{
  seats: 3,
  guestName: "John Doe",
  guestMobile: "9876543210",
  additionalGuests: [
    { name: "Jane Smith", mobile: "...", age: 28, gender: "Female" },
    { name: "Bob Wilson", mobile: "...", age: 35, gender: "Male" }
  ]
}
```

**Result:** User has booked max 3 seats. **Cannot book more** for this event.

---

### **Scenario 3: Second Booking - User Already Has 1 Seat**
```
User visits SAME Event Page (has existing booking of 1 seat)
└─> Shows amber card:
    ┌───────────────────────────────────────────┐
    │ ✓ You've already booked this event        │
    │ Seats booked: 1                           │
    │ Primary guest: John Doe • 9876543210      │
    │ Amount paid: ₹500                         │
    │ Status: CONFIRMED                         │
    │                                           │
    │ 💡 You can book 2 more seats for this     │
    │    event (3 seats max per person)         │
    └───────────────────────────────────────────┘

└─> Shows: "Book additional seats as: John Doe"
└─> Label: "Number of Additional Guests"
└─> Dropdown: [1 guest] [2 guests]  (NOT "1 seat", "2 seats"!)
└─> Helper: "Add up to 2 more guests to your booking"
└─> User selects: 2 guests
└─> Shows "Guest Details (0 of 2 added)"
└─> User adds Guest #1: Jane Smith
└─> User adds Guest #2: Bob Wilson
└─> Button: "Add Guests to Booking"
└─> Clicks button
└─> ✅ Added 2 guests

New Booking in Database:
{
  seats: 2,
  guestName: "Jane Smith",        // ← First guest becomes primary
  guestMobile: "9876543211",
  additionalGuests: [
    { name: "Bob Wilson", mobile: "...", age: 35, gender: "Male" }
  ]
}

Total for User: 1 (previous) + 2 (new) = 3 seats ✅
```

**Key Differences:**
- ❌ Does NOT ask for user's details again
- ✅ All seats are for additional guests
- ✅ First guest from list becomes "primary" in new booking
- ✅ Label says "guests" not "seats"
- ✅ Button says "Add Guests to Booking"

---

### **Scenario 4: Second Booking - User Already Has 2 Seats**
```
User visits SAME Event Page (has existing booking of 2 seats)
└─> Shows amber card with existing booking
└─> Dropdown: [1 guest]  (only 1 spot left!)
└─> User selects: 1 guest
└─> Shows "Guest Details (0 of 1 added)"
└─> User adds Guest #1: Mike Johnson
└─> Clicks "Add Guests to Booking"
└─> ✅ Added 1 guest

Total: 2 (previous) + 1 (new) = 3 seats ✅
Maximum reached!
```

---

### **Scenario 5: Maximum Reached**
```
User visits SAME Event Page (has 3 seats total)
└─> Shows amber card:
    🔒 You've reached the maximum limit of 3 seats
└─> No booking form shown
└─> Button: "Maximum Seats Booked" (disabled)
└─> Cannot book more ❌
```

---

## 🎨 **UI DIFFERENCES**

### **First Booking (No Existing):**
```
┌─────────────────────────────────────────┐
│ Booking as:                             │
│ John Doe                                │
│ 9876543210 • 30y • Male                 │
└─────────────────────────────────────────┘

Number of Seats
[ 1 seat ▼ ]
Maximum 3 seats per booking (yourself + 2 guests)

[If 2-3 seats selected:]
Additional Guests (0 of X added)
  Guest #2 - Not added yet     [Add Guest]
  Guest #3 - Not added yet     [Add Guest]

[Book]
```

---

### **Subsequent Booking (Has Existing):**
```
┌─────────────────────────────────────────┐
│ ✓ You've already booked this event      │
│ Seats booked: 1                         │
│ Primary guest: John Doe • 9876543210    │
│ ...                                     │
│ 💡 You can book 2 more seats            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Book additional seats as:               │
│ John Doe                                │
│ 9876543210 • 30y • Male                 │
└─────────────────────────────────────────┘

Number of Additional Guests
[ 1 guest ▼ ]
Add up to 2 more guests to your booking

Guest Details (0 of X added)
Add details for each additional guest joining your booking

  Guest #1 - Not added yet     [Add Guest]
  Guest #2 - Not added yet     [Add Guest]

[Add Guests to Booking]
```

**Key UI Changes:**
1. ✅ "Number of Seats" → "Number of Additional Guests"
2. ✅ "1 seat" → "1 guest"
3. ✅ "Additional Guests" → "Guest Details" (all are additional)
4. ✅ "Guest #2" → "Guest #1" (numbering starts at 1, not 2)
5. ✅ "Book" → "Add Guests to Booking"
6. ✅ Different helper text
7. ✅ Info text: "Add details for each additional guest"

---

## 💾 **DATABASE STRUCTURE**

### **First Booking (1 Seat):**
```json
{
  "bookingId": "booking_001",
  "eventSlotId": "event_123",
  "guestUserId": "user_789",
  "seats": 1,
  "guestName": "John Doe",
  "guestMobile": "9876543210",
  "guestAge": 30,
  "guestGender": "Male",
  "additionalGuests": [],
  "amountTotal": 50000,
  "status": "CONFIRMED"
}
```

---

### **Second Booking (2 More Guests):**
```json
{
  "bookingId": "booking_002",
  "eventSlotId": "event_123",
  "guestUserId": "user_789",        // Same user!
  "seats": 2,
  "guestName": "Jane Smith",        // First guest as primary
  "guestMobile": "9876543211",
  "guestAge": 28,
  "guestGender": "Female",
  "additionalGuests": [
    {
      "name": "Bob Wilson",
      "mobile": "9876543212",
      "age": 35,
      "gender": "Male"
    }
  ],
  "amountTotal": 100000,
  "status": "CONFIRMED"
}
```

**Total Seats for User:** 1 + 2 = 3 ✅

**Important:** 
- Two separate booking documents
- Same `guestUserId` links them
- First guest in additional bookings becomes "primary" in that booking record
- This is for database structure - the user knows these are all additional guests

---

## 🔄 **BOOKING FLOW LOGIC**

### **Frontend Logic:**
```javascript
// Determine if user has existing booking
const hasExistingBooking = existingBooking !== null;
const alreadyBookedSeats = existingBooking?.seats || 0;
const remainingSeatsAllowed = 3 - alreadyBookedSeats;

// Determine number of guest details needed
const guestsNeeded = hasExistingBooking 
  ? bookingSeats          // All seats are guests
  : bookingSeats - 1;     // Minus user (primary)

// Validation
const canBook = hasExistingBooking
  ? additionalGuests.length === bookingSeats
  : (bookingSeats === 1 || additionalGuests.length === bookingSeats - 1);

// Booking data
const bookingData = hasExistingBooking && additionalGuests.length > 0
  ? {
      // Use first guest as "primary" for database
      guestName: additionalGuests[0].name,
      guestMobile: additionalGuests[0].mobile,
      guestAge: additionalGuests[0].age,
      guestGender: additionalGuests[0].gender,
      additionalGuests: additionalGuests.slice(1)
    }
  : {
      // Use current user as primary
      guestName: currentUser.name,
      guestMobile: currentUser.mobile,
      guestAge: currentUser.age,
      guestGender: currentUser.gender,
      additionalGuests: additionalGuests
    };
```

---

## 📋 **VALIDATION RULES**

### **Frontend Validation:**

**First Booking:**
- ✅ 1 seat: No additional guests required
- ✅ 2 seats: 1 additional guest required
- ✅ 3 seats: 2 additional guests required

**Subsequent Booking:**
- ✅ 1 guest: 1 guest detail required
- ✅ 2 guests: 2 guest details required
- ✅ Cannot exceed remaining seats (3 - already booked)

**Error Messages:**
- "Please add details for all guests"
- "Add details for all X guests to proceed"

---

## 🎨 **BUTTON TEXT CHANGES**

| State | Button Text |
|-------|-------------|
| First booking, no guests | **"Book"** |
| First booking, with guests | **"Book"** |
| Additional booking | **"Add Guests to Booking"** |
| In progress | **"Booking..."** |
| Maximum reached | **"Maximum Seats Booked"** (disabled) |

---

## ✅ **SUCCESS MESSAGES**

### **First Booking:**
```
Booking confirmed! 
Amount: ₹1500. 
You can view all your bookings in My Bookings page.
```

### **Additional Booking:**
```
2 guests added! 
Amount: ₹1000. 
Total booking: 3 seats.
```

**Shows:**
- Number of guests added
- Amount for THIS booking
- NEW: Total seats across all bookings

---

## 🧪 **TESTING SCENARIOS**

### **Test 1: First Time - 1 Seat**
1. Visit event (no existing booking)
2. See "Booking as: John Doe"
3. Select 1 seat
4. Click "Book"
5. ✅ Success - 1 seat booked

### **Test 2: First Time - 3 Seats**
1. Visit event (no existing booking)
2. Select 3 seats
3. Add 2 guests
4. Click "Book"
5. ✅ Success - 3 seats booked (max reached)

### **Test 3: Second Time - Add 2 Guests**
1. Visit event (has 1 seat)
2. See existing booking card
3. See "Number of Additional Guests"
4. Dropdown shows [1 guest] [2 guests]
5. Select 2 guests
6. Form shows "Guest Details (0 of 2 added)"
7. Add Guest #1 and Guest #2
8. Button says "Add Guests to Booking"
9. Click button
10. ✅ Success - 2 guests added, total 3 seats

### **Test 4: Try to Book More (Max Reached)**
1. Visit event (has 3 seats)
2. See amber card with lock icon
3. No form shown
4. Button disabled
5. ✅ Correct - cannot book more

### **Test 5: Different Event**
1. Visit different event
2. No existing booking for THIS event
3. Fresh booking form
4. Can book 1-3 seats again
5. ✅ Correct - limits are per-event

---

## 🚀 **USER BENEFITS**

### **For Guests:**
1. **No Confusion:** Clear distinction between booking for yourself vs adding guests
2. **Proper Tracking:** System knows user is already attending
3. **Accurate Guest List:** All additional bookings are clearly guests, not duplicates
4. **Fair Access:** Can't book yourself multiple times to hog seats
5. **Flexibility:** Can add guests incrementally (1 now, 2 later)

### **For Hosts:**
1. **Clear Attendance:** Know exactly who's primary and who's additional
2. **No Duplicates:** User can't book themselves multiple times
3. **Better Planning:** Accurate count of unique attendees
4. **Contact Info:** All guest details available
5. **Group Identification:** Can see which guests are together

---

## 📊 **EXAMPLE SCENARIOS**

### **Example 1: Solo First, Friends Later**
```
Day 1: Book 1 seat for myself
       Total: 1 seat (me)

Day 2: Add 2 friends
       Select "2 guests"
       Add Jane and Bob
       Total: 3 seats (me + Jane + Bob)
```

### **Example 2: Two Friends First, One More Later**
```
Day 1: Book 2 seats (me + Jane)
       Total: 2 seats

Day 2: Add 1 more friend (Bob)
       Select "1 guest"
       Add Bob
       Total: 3 seats (me + Jane + Bob)
```

### **Example 3: All Together**
```
Day 1: Book 3 seats (me + Jane + Bob)
       Total: 3 seats (max reached)

Day 2: Cannot book more ❌
```

---

## ✅ **BUILD STATUS**
**Status:** ✅ **PASSING**
- All TypeScript compilation successful
- Logic handles existing bookings correctly
- UI adapts based on booking state
- Validation works for both scenarios
- Database structure supports multiple bookings
- Ready for production!

---

This feature ensures users can't accidentally book themselves multiple times while providing flexibility to add friends and family incrementally up to the 3-seat maximum.
