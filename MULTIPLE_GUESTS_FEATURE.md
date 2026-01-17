# Multiple Guests Booking Feature

## Overview
Allows guests to book up to 3 seats per event and provide details for each additional attendee through a modal interface.

---

## ✅ FEATURES IMPLEMENTED

### **1. Maximum Seat Limit**
- **Limit:** 3 seats per booking (including the primary guest)
- **Enforced:** Client-side validation + Backend validation
- **User Experience:** Clear messaging about the limit

### **2. Additional Guest Details**
When a guest selects 2 or 3 seats, they must provide:
- Name (required)
- Mobile number (10 digits, required)
- Age (1-99, required)
- Gender (Male/Female/Other, required)

### **3. Beautiful Modal Interface**
- Polished modal design matching app theme
- User-friendly form with validation
- Real-time feedback on errors
- Edit functionality for already-added guests

---

## 🎨 USER EXPERIENCE

### **Booking Flow:**

#### **Step 1: Select Seats**
- Guest sees seat selector limited to 3 max
- Helper text: "You can book up to 3 seats (including yourself)"
- Seats dropdown updates to `min(available_seats, 3)`

#### **Step 2: Add Additional Guests (if seats ≥ 2)**
- Expandable section appears: **"Additional Guests"**
- Shows progress: "0 of 2 added" or "1 of 2 added"
- Each guest slot shows:
  - **Not Added:** "Guest #2 - Not added yet" with "Add" button
  - **Added:** Guest details + "Edit" button

#### **Step 3: Fill Guest Details Modal**
- Modal appears with title: **"Add Guest #{number}"**
- Icon: Person icon in gradient circle
- 4 input fields (Name, Mobile, Age, Gender)
- Validation on save
- Cancel option available

#### **Step 4: Confirm Booking**
- "Book Now" button **disabled** until all guest details added
- Helper text: "Add all guest details to proceed"
- Once all guests added → Button enabled

---

## 💻 TECHNICAL IMPLEMENTATION

### **Files Created:**

#### **1. `/src/components/modals/add-guest-modal.tsx`**
Modal component for adding/editing guest details.

**Props:**
```typescript
{
  isOpen: boolean;
  onClose: () => void;
  onSave: (guest: AdditionalGuest) => void;
  guestNumber: number;
}
```

**Type:**
```typescript
export type AdditionalGuest = {
  name: string;
  mobile: string;
  age: number;
  gender: string;
};
```

**Features:**
- Real-time validation
- Error display
- Clean form reset on save/cancel
- Mobile-optimized layout

---

### **Files Modified:**

#### **1. `/src/app/events/[eventId]/page.tsx`**
**Changes:**
- Added `additionalGuests` state array
- Added modal state management
- Limited seats to max 3
- Added Additional Guests section UI
- Integrated "Add/Edit" buttons
- Disabled booking button until all guests added
- Pass `additionalGuests` to booking API

**State Management:**
```typescript
const [additionalGuests, setAdditionalGuests] = useState<AdditionalGuest[]>([]);
const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState(false);
const [currentGuestNumber, setCurrentGuestNumber] = useState(0);
```

**UI Components:**
- Guest slot cards showing status
- Progress indicator
- Add/Edit buttons per guest
- Validation helper text

---

#### **2. `/src/server/models/Booking.ts`**
**Added Field:**
```typescript
additionalGuests: {
  type: [{
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true, enum: ["Male", "Female", "Other"] }
  }],
  default: []
}
```

**Purpose:**
- Store details of all additional attendees
- Host can see who's attending
- Used for event management and communication

---

#### **3. `/src/app/api/guest/bookings/route.ts`**
**Schema Updates:**
```typescript
const additionalGuestSchema = z.object({
  name: z.string().min(1).max(100),
  mobile: z.string().min(10).max(15),
  age: z.number().int().min(1).max(120),
  gender: z.enum(["Male", "Female", "Other"])
});

const schema = z.object({
  // ... existing fields
  seats: z.coerce.number().int().min(1).max(3), // LIMITED TO 3
  additionalGuests: z.array(additionalGuestSchema).default([])
}).refine((data) => {
  // Validation: seats > 1 requires (seats - 1) additional guests
  if (data.seats > 1) {
    return data.additionalGuests.length === data.seats - 1;
  }
  return true;
}, {
  message: "Must provide details for all additional guests",
  path: ["additionalGuests"]
});
```

**Validation Logic:**
- 1 seat → 0 additional guests
- 2 seats → 1 additional guest
- 3 seats → 2 additional guests

---

#### **4. `/src/server/services/bookingService.ts`**
**Function Signature Update:**
```typescript
export async function createBooking(input: {
  // ... existing fields
  additionalGuests?: Array<{
    name: string;
    mobile: string;
    age: number;
    gender: string;
  }>;
}) {
  // Saves additionalGuests array to Booking document
}
```

---

## 🎯 VALIDATION RULES

### **Client-Side:**
1. **Seats:** 1-3 (limited by `Math.min(available, 3)`)
2. **Guest Name:** Non-empty, trimmed
3. **Mobile:** 10 digits minimum
4. **Age:** 1-99 range
5. **Gender:** Must select from dropdown
6. **Completeness:** All guest slots must be filled before booking

### **Backend (API):**
1. **Schema Validation:** Zod validates all fields
2. **Seats Limit:** Maximum 3 seats
3. **Guest Count:** `additionalGuests.length === seats - 1`
4. **Type Safety:** TypeScript enforces correct data structure

---

## 📊 DATA STRUCTURE

### **Booking Document Example:**
```json
{
  "_id": "...",
  "eventSlotId": "...",
  "guestUserId": "...",
  "seats": 3,
  
  // Primary guest (booking user)
  "guestName": "John Doe",
  "guestMobile": "9876543210",
  "guestAge": 30,
  "guestGender": "Male",
  
  // Additional guests
  "additionalGuests": [
    {
      "name": "Jane Smith",
      "mobile": "9876543211",
      "age": 28,
      "gender": "Female"
    },
    {
      "name": "Bob Johnson",
      "mobile": "9876543212",
      "age": 35,
      "gender": "Male"
    }
  ],
  
  "amountTotal": 4500,
  "status": "PAYMENT_PENDING"
}
```

---

## 🎨 MODAL DESIGN DETAILS

### **Visual Elements:**
- **Icon:** Person silhouette in gradient circle (primary/20 to primary/10)
- **Title:** "Add Guest #{number}" (clear identification)
- **Subtitle:** "Provide details for your additional guest"
- **Close Button:** Top-right X with hover effect
- **Form:** 4 clean input fields with labels
- **Error Display:** Red rounded box at top when validation fails
- **Actions:** Two buttons (Save primary, Cancel secondary)

### **Color Scheme:**
- Primary: Coral/orange for accents
- Sand: Input borders and backgrounds
- Ink: Text hierarchy
- Red: Error states
- White: Modal background

### **Interaction:**
- Click backdrop → Close modal
- Click X button → Close modal
- Click Cancel → Close modal (no save)
- Click Save → Validate → Save → Close
- Modal stops propagation (clicking inside doesn't close)

---

## 🔄 USER FLOWS

### **Flow 1: Single Seat Booking**
1. Guest selects 1 seat
2. Fills own details
3. Clicks "Book Now"
4. → Booking created (no additional guests)

### **Flow 2: Two Seats Booking**
1. Guest selects 2 seats
2. "Additional Guests" section appears
3. Shows "Guest #2 - Not added yet" with "Add" button
4. Guest clicks "Add"
5. Modal opens
6. Guest fills details for Guest #2
7. Clicks "Save Guest Details"
8. Modal closes, Guest #2 details now shown
9. "Book Now" button enabled
10. Guest clicks "Book Now"
11. → Booking created with 1 additional guest

### **Flow 3: Three Seats Booking**
1. Guest selects 3 seats
2. "Additional Guests" section shows 2 slots
3. Guest adds details for Guest #2
4. Guest adds details for Guest #3
5. Both guests now show with details + "Edit" buttons
6. "Book Now" enabled
7. → Booking created with 2 additional guests

### **Flow 4: Edit Guest Details**
1. Guest already added details for Guest #2
2. Guest clicks "Edit" button on Guest #2 card
3. Modal opens pre-filled (currently resets, can be enhanced)
4. Guest modifies details
5. Clicks "Save"
6. Updated details replace old ones in array

### **Flow 5: Reduce Seats After Adding Guests**
1. Guest selects 3 seats
2. Adds Guest #2 and Guest #3
3. Changes seats dropdown to 2
4. → Guest #3 automatically removed from array
5. Only Guest #2 remains

---

## ✅ BENEFITS FOR HOSTS

### **Host Dashboard View:**
When viewing bookings, hosts can see:
- **Primary Guest:** Name, mobile, age, gender
- **Additional Guests:** Array of all attendees with same details
- **Total Count:** Accurate headcount for planning
- **Contact Info:** Can reach out to each attendee if needed

### **Use Cases:**
1. **Food Planning:** Know exact number of people
2. **Seating Arrangements:** Plan table setup
3. **Communication:** Contact each guest if needed
4. **Age Demographics:** Plan age-appropriate activities
5. **Group Dynamics:** See if guests are mixed or similar

---

## 📱 RESPONSIVE DESIGN

### **Mobile:**
- Modal fits screen with padding
- Touch-friendly button sizes
- Easy-to-tap close button
- Scrollable if content overflows

### **Tablet:**
- Modal slightly larger
- More comfortable spacing

### **Desktop:**
- Max-width 448px (`max-w-md`)
- Centered on screen
- Generous whitespace

---

## 🧪 TESTING SCENARIOS

### **Test 1: Single Seat**
- [ ] Select 1 seat
- [ ] No additional guests section shows
- [ ] Book Now works immediately

### **Test 2: Two Seats - Happy Path**
- [ ] Select 2 seats
- [ ] Additional guests section appears
- [ ] Click "Add" opens modal
- [ ] Fill all fields, click "Save"
- [ ] Guest details show correctly
- [ ] Book Now enabled

### **Test 3: Three Seats - Happy Path**
- [ ] Select 3 seats
- [ ] 2 guest slots appear
- [ ] Add both guests successfully
- [ ] Book Now enabled
- [ ] Booking creates with 2 additional guests

### **Test 4: Validation**
- [ ] Try to save empty name → Error shown
- [ ] Try to save invalid mobile → Error shown
- [ ] Try to save age 0 or 100 → Error shown
- [ ] Try to book without all guests → Button disabled

### **Test 5: Edit Functionality**
- [ ] Add guest details
- [ ] Click "Edit" button
- [ ] Modal opens
- [ ] Modify and save
- [ ] Updated details displayed

### **Test 6: Reduce Seats**
- [ ] Select 3 seats, add 2 guests
- [ ] Change to 2 seats
- [ ] Verify only 1 guest remains
- [ ] Change to 1 seat
- [ ] Verify all additional guests removed

### **Test 7: Seat Limit**
- [ ] Verify dropdown maxes at 3
- [ ] Verify API rejects seats > 3
- [ ] Verify helper text shows limit

---

## 🚀 BUILD STATUS
**Status:** ✅ **BUILD PASSING**
- All TypeScript compilation successful
- Database model updated
- API validation working
- Modal renders correctly
- Event page updated

---

## 📈 FUTURE ENHANCEMENTS

### **Phase 2 Ideas:**
1. **Pre-fill Edit Modal:** Populate form with existing guest data when editing
2. **Duplicate Guest Check:** Warn if same mobile number used
3. **Quick Copy:** "Same as me" button to copy primary guest's age/gender
4. **Guest Invitations:** Send invite to additional guests' mobiles
5. **Group Discounts:** Automatic discount for 3-seat bookings
6. **Relationship Field:** "Friend", "Family", "Colleague" for each guest
7. **Dietary Preferences:** Collect food restrictions per guest
8. **Emergency Contact:** Option to mark one guest as emergency contact
9. **Guest Confirmation:** Each guest confirms attendance via SMS
10. **Split Payment:** Allow splitting bill among guests

---

This implementation provides a smooth, validated, user-friendly way for guests to book multiple seats while ensuring hosts have all necessary attendee information.
