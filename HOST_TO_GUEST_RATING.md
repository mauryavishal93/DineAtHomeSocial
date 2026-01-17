# Host-to-Guest Rating Feature

## Overview
Hosts can now rate guests after an event is completed, using 6 comprehensive categories. This feature is integrated into the "My Events" page with a collapse/expand UI for better organization.

---

## ✅ **WHAT'S IMPLEMENTED**

### **1. Six Rating Categories**
Each guest can be rated on:

1. **⏰ Punctuality** - Did the guest arrive on time?
2. **👔 Appearance** - Was the guest appropriately dressed?
3. **💬 Communication / Interaction** - How well did the guest communicate and interact?
4. **🤝 Behavior / Manners** - Did the guest display good manners and behavior?
5. **🎯 Engagement in Activities** - How engaged was the guest in event activities?
6. **✨ Overall Presence** - Overall impression of the guest

**Rating Scale:** 1-5 stars for each category ⭐⭐⭐⭐⭐

---

### **2. UI/UX Features**

#### **Collapse/Expand Guest List**
```
My Events Page
├── Event Card
│   ├── Event Details (Title, Date, Venue)
│   ├── Status Badge (Completed)
│   ├── Guest Count Summary
│   └── [View Guest List Button] ← Click to expand
│       ↓
│       └── Guest List (Expanded)
│           ├── Guest 1: Name, Age, Gender + [⭐ Rate Guest]
│           ├── Guest 2: Name, Age, Gender + [⭐ Rate Guest]
│           └── Guest 3: Name, Age, Gender + [⭐ Rate Guest]
```

#### **Rating Modal**
When clicking "⭐ Rate Guest":
```
┌─────────────────────────────────────┐
│  Rate Guest                         │
│  [Guest Name] • [Age] years • [Gender]
├─────────────────────────────────────┤
│                                     │
│  ⏰ Punctuality                     │
│  ★★★★★                              │
│                                     │
│  👔 Appearance                      │
│  ★★★★★                              │
│                                     │
│  💬 Communication / Interaction     │
│  ★★★★★                              │
│                                     │
│  🤝 Behavior / Manners              │
│  ★★★★★                              │
│                                     │
│  🎯 Engagement in Activities        │
│  ★★★★★                              │
│                                     │
│  ✨ Overall Presence                │
│  ★★★★★                              │
│                                     │
│  💭 Additional Comments (Optional)  │
│  [Textarea]                         │
│                                     │
│  [Cancel]  [Submit Rating]          │
└─────────────────────────────────────┘
```

---

## 🎯 **HOW IT WORKS**

### **For Hosts:**

#### **Step 1: Navigate to My Events**
- Go to `/host/my-events` page
- See list of your past (completed) events

#### **Step 2: Expand Event**
- Click "View Guest List" button on any event
- Guest list expands showing all attendees

#### **Step 3: Rate a Guest**
- Click "⭐ Rate Guest" next to any guest
- Rating modal opens showing guest details
- Rate all 6 categories (1-5 stars each)
- Optionally add comments
- Click "Submit Rating"

#### **Step 4: View Existing Ratings**
- If you already rated a guest, clicking "⭐ Rate Guest" shows your previous rating
- Modal displays in read-only mode
- Can't rate the same guest twice for the same event

---

## 📊 **DATABASE STRUCTURE**

### **Feedback Model Updates**

```typescript
FeedbackSchema = {
  // Existing fields
  eventSlotId: ObjectId,
  bookingId: ObjectId,
  fromUserId: ObjectId,      // Host's user ID
  toUserId: ObjectId,         // Guest's user ID
  
  feedbackType: "HOST_TO_GUEST",  // NEW type
  rating: Number,             // Overall average (calculated)
  comment: String,            // Optional text comment
  
  // NEW: 6 rating categories
  punctualityRating: Number,       // 1-5
  appearanceRating: Number,        // 1-5
  communicationRating: Number,     // 1-5
  behaviorRating: Number,          // 1-5
  engagementRating: Number,        // 1-5
  overallPresenceRating: Number,   // 1-5
  
  isVerifiedAttendance: true,
  timestamps: true
}
```

### **Overall Rating Calculation**

```javascript
overallRating = (
  punctualityRating + 
  appearanceRating + 
  communicationRating + 
  behaviorRating + 
  engagementRating + 
  overallPresenceRating
) / 6

// Example:
// 5 + 4 + 5 + 4 + 3 + 4 = 25
// 25 / 6 = 4.17 ⭐
```

---

## 🔐 **ELIGIBILITY & VALIDATION**

### **Requirements to Rate:**

1. ✅ **Event Must Be Completed**
   - `event.endAt < current time`
   - Cannot rate ongoing or future events

2. ✅ **User Must Be The Host**
   - `event.hostUserId === current user ID`
   - Only the event host can rate guests

3. ✅ **Guest Must Have Attended**
   - Booking status: CONFIRMED, COMPLETED, or PAYMENT_PENDING
   - Guest actually registered for the event

4. ✅ **No Duplicate Ratings**
   - One rating per guest per event
   - Prevents rating spam

### **API Validation Flow**

```javascript
// 1. Check event completion
if (!isEventCompleted(eventSlotId)) {
  return "Event has not been completed yet";
}

// 2. Verify host ownership
if (event.hostUserId !== currentUserId) {
  return "You are not the host of this event";
}

// 3. Verify guest attendance
const booking = await Booking.findOne({
  eventSlotId,
  guestUserId,
  status: { $in: ["CONFIRMED", "COMPLETED", "PAYMENT_PENDING"] }
});
if (!booking) {
  return "Guest did not attend this event";
}

// 4. Check for duplicates
const existingRating = await Feedback.findOne({
  eventSlotId,
  fromUserId: hostUserId,
  toUserId: guestUserId,
  feedbackType: "HOST_TO_GUEST"
});
if (existingRating) {
  return "You have already rated this guest";
}

// ✅ All checks passed!
return { canRate: true };
```

---

## 🎨 **UI COMPONENTS**

### **1. RateGuestModal Component**

**Path:** `/src/components/modals/rate-guest-modal.tsx`

**Features:**
- Interactive star rating for each category
- Real-time visual feedback (yellow/gold stars)
- Optional comment textarea
- Validation (all categories required)
- Read-only mode for existing ratings
- Responsive design

**Props:**
```typescript
{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GuestRatingData) => void;
  guestName: string;
  guestAge: number;
  guestGender: string;
  existingRating?: GuestRatingData | null;
}
```

### **2. My Events Page Updates**

**Path:** `/src/app/host/my-events/page.tsx`

**New Features:**
- Collapse/expand state management per event
- "View Guest List" button with arrow icon
- Expanded section shows full guest details
- "Rate Guest" button for each attendee
- Modal state management
- Auto-refresh after rating submission

---

## 🔄 **RATING CALCULATION & UPDATES**

### **Guest Profile Update**

When a host rates a guest, the guest's cumulative rating is updated:

```javascript
// Get all ratings for this guest
const ratings = await Feedback.find({
  toUserId: guestUserId,
  feedbackType: { $in: ["GUEST", "HOST_TO_GUEST"] }
});

// Calculate new average
let totalRating = 0;
let count = 0;

for (const rating of ratings) {
  if (rating.feedbackType === "GUEST") {
    // Co-guest rating (single value)
    totalRating += rating.guestRating;
    count++;
  } else if (rating.feedbackType === "HOST_TO_GUEST") {
    // Host-to-guest rating (average of 6 categories)
    const categoryAvg = (
      rating.punctualityRating +
      rating.appearanceRating +
      rating.communicationRating +
      rating.behaviorRating +
      rating.engagementRating +
      rating.overallPresenceRating
    ) / 6;
    totalRating += categoryAvg;
    count++;
  }
}

const newAverage = totalRating / count;

// Update guest profile
await GuestProfile.update({
  ratingAvg: newAverage,
  ratingCount: count
});
```

### **Example Calculation**

Guest has 3 ratings:
1. Co-guest rating: 4 stars
2. Co-guest rating: 5 stars  
3. Host rating: (5+4+5+4+3+4)/6 = 4.17 stars

**Total Average:**
```
(4 + 5 + 4.17) / 3 = 4.39 stars ⭐
```

---

## 📡 **API ENDPOINTS**

### **1. Check Eligibility & Get Existing Rating**

**GET** `/api/host/rate-guest?eventSlotId={id}&guestUserId={id}`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "data": {
    "canRate": true,
    "reason": null,
    "existingRating": {
      "punctualityRating": 5,
      "appearanceRating": 4,
      "communicationRating": 5,
      "behaviorRating": 4,
      "engagementRating": 3,
      "overallPresenceRating": 4,
      "comment": "Great guest!",
      "ratedAt": "2026-01-17T10:30:00Z"
    }
  }
}
```

**If Already Rated:**
```json
{
  "data": {
    "canRate": false,
    "reason": "You have already rated this guest",
    "existingRating": { ... }
  }
}
```

---

### **2. Submit Rating**

**POST** `/api/host/rate-guest`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "eventSlotId": "65abc...",
  "bookingId": "65def...",
  "guestUserId": "65ghi...",
  "punctualityRating": 5,
  "appearanceRating": 4,
  "communicationRating": 5,
  "behaviorRating": 4,
  "engagementRating": 3,
  "overallPresenceRating": 4,
  "comment": "Great guest, very polite and engaged!"
}
```

**Validation:**
- All rating fields: Required, 1-5
- Comment: Optional, string
- Authorization: Required (host only)

**Success Response:**
```json
{
  "data": {
    "success": true,
    "message": "Guest rating submitted successfully"
  }
}
```

**Error Response:**
```json
{
  "error": "You have already rated this guest"
}
```

---

## 🧪 **TESTING SCENARIOS**

### **Test 1: Rate a Guest Successfully**

**Steps:**
1. Create event as host (yesterday)
2. Have guest book and attend
3. Wait for event to complete
4. Go to My Events
5. Click "View Guest List"
6. Click "⭐ Rate Guest"
7. Rate all 6 categories
8. Add optional comment
9. Click "Submit Rating"

**Expected:**
- ✅ Modal opens with guest details
- ✅ All 6 star ratings work
- ✅ Comment field accepts text
- ✅ Submit succeeds
- ✅ Success message shows
- ✅ Guest profile updated
- ✅ Page refreshes

---

### **Test 2: View Existing Rating**

**Steps:**
1. Use same event from Test 1
2. Try to rate the same guest again
3. Click "⭐ Rate Guest"

**Expected:**
- ✅ Modal shows existing ratings (read-only)
- ✅ All star ratings displayed correctly
- ✅ Comment shown (if any)
- ✅ "Submit Rating" button hidden
- ✅ Only "Close" button visible
- ✅ Message: "You have already rated this guest"

---

### **Test 3: Cannot Rate Ongoing Event**

**Steps:**
1. Create event for tomorrow
2. Have guest book
3. Try to rate guest before event

**Expected:**
- ❌ "Rate Guest" button disabled or eligibility check fails
- ❌ Error: "Event has not been completed yet"

---

### **Test 4: Cannot Rate Guest Who Didn't Attend**

**Steps:**
1. Create completed event
2. Find user who didn't book
3. Try to rate that user

**Expected:**
- ❌ Guest not in the list
- ❌ Or error: "Guest did not attend this event"

---

### **Test 5: Collapse/Expand Works**

**Steps:**
1. Go to My Events
2. See multiple past events
3. Click "View Guest List" on Event 1
4. Click "View Guest List" on Event 2

**Expected:**
- ✅ Event 1 list expands
- ✅ Event 2 list expands
- ✅ Both can be expanded simultaneously
- ✅ Clicking "Hide Guest List" collapses
- ✅ Arrow icons change direction

---

## 📈 **BENEFITS**

### **For Hosts:**
- ✅ Detailed feedback about each guest
- ✅ Multiple evaluation criteria
- ✅ Helps identify problematic guests
- ✅ Can see historical ratings
- ✅ Builds trust in the community

### **For Guests:**
- ✅ Receives comprehensive feedback
- ✅ Understands their strengths/weaknesses
- ✅ Can improve their behavior
- ✅ Better guest ratings = more bookings
- ✅ Builds reputation

### **For Platform:**
- ✅ Enhanced trust & safety
- ✅ Quality control mechanism
- ✅ Data-driven insights
- ✅ Community self-regulation
- ✅ Reduces problematic users

---

## 🎯 **USER STORIES**

### **Story 1: Professional Host**
> "As a host who runs weekly dinner events, I need to rate my guests so I can identify which guests are respectful and engaged, and avoid problematic attendees in the future."

**Solution:** ✅ 6-category rating system provides detailed feedback

---

### **Story 2: New Host**
> "As a new host, I want to see how other hosts rated my guests before accepting bookings, so I can make informed decisions about who attends my events."

**Solution:** ✅ Guest ratings are cumulative and visible in guest profiles

---

### **Story 3: Thoughtful Host**
> "As a host, I want to provide constructive feedback to guests who were late or disengaged, so they can improve for future events."

**Solution:** ✅ Optional comment field allows personalized feedback

---

## 🔄 **RATING WORKFLOW**

```
┌─────────────────────────────────────┐
│  Event Completed                    │
│  (endAt < now)                      │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Host Visits "My Events"            │
│  Sees past events                   │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Click "View Guest List"            │
│  Event expands                      │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  See guest: John Doe, 28, Male      │
│  Click "⭐ Rate Guest"               │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Modal Opens                        │
│  - Check eligibility (API)          │
│  - Load existing rating (if any)    │
└─────────────┬───────────────────────┘
              │
              ├─── Already Rated? ────────┐
              │                            │
              NO                          YES
              │                            │
              ▼                            ▼
┌─────────────────────┐     ┌──────────────────────┐
│  Show Rating Form   │     │  Show Existing Rating│
│  - 6 star inputs    │     │  (Read-only)         │
│  - Comment field    │     │  - Close button only │
│  - Submit button    │     └──────────────────────┘
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  Host Rates All 6 Categories        │
│  Adds optional comment              │
│  Clicks "Submit Rating"             │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Validation                         │
│  - All ratings 1-5? ✅              │
│  - User is host? ✅                 │
│  - Event completed? ✅              │
│  - Guest attended? ✅               │
│  - Not duplicate? ✅                │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Save to Database                   │
│  - Create Feedback doc              │
│  - Calculate overall rating         │
│  - Update guest profile             │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Success!                           │
│  - Show success message             │
│  - Close modal                      │
│  - Refresh page                     │
└─────────────────────────────────────┘
```

---

## ✅ **BUILD STATUS**

```
✅ Database schema: UPDATED
✅ Feedback model: HOST_TO_GUEST type added
✅ Backend service: Rating logic implemented
✅ API endpoint: /api/host/rate-guest created
✅ Rating modal: RateGuestModal component created
✅ My Events UI: Collapse/expand added
✅ Guest list: Rating button integrated
✅ Eligibility check: Implemented
✅ Duplicate prevention: Working
✅ Guest profile update: Cumulative rating calculated
✅ TypeScript: All types defined
✅ Build: PASSING
✅ Ready for production!
```

---

## 📝 **SUMMARY**

| Feature | Status |
|---------|--------|
| 6 Rating Categories | ✅ Complete |
| Collapse/Expand UI | ✅ Complete |
| Rating Modal | ✅ Complete |
| API Endpoint | ✅ Complete |
| Eligibility Check | ✅ Complete |
| Duplicate Prevention | ✅ Complete |
| Guest Profile Update | ✅ Complete |
| Read-Only View | ✅ Complete |
| Validation | ✅ Complete |

**Your hosts can now provide comprehensive, detailed ratings for each guest that attended their events!** 🎉
