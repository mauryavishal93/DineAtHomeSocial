# Feedback & Rating System

## Overview
Complete implementation of a two-category rating system that allows guests to rate both hosts and co-guests after event completion.

---

## ✅ FEATURES IMPLEMENTED

### **1. Timing Control**
- ✅ Ratings only available after event completion (after `endAt` time passes)
- ✅ Automatic eligibility checking based on event end time
- ✅ Verification that guest attended (has confirmed/completed booking)

### **2. Two-Category Rating System**

#### **Category 1: Host Rating** (4 Criteria)
- **Event Quality** - Overall event experience (1-5 stars)
- **Venue Rating** - Ambiance and venue quality (1-5 stars)
- **Food Quality** - Quality of food served (1-5 stars)
- **Hospitality** - Host friendliness and service (1-5 stars)

**Calculated:** Overall host rating = Average of 4 criteria

#### **Category 2: Co-Guest Rating** (Simple)
- **Guest Rating** - Simple star rating for each co-guest (1-5 stars)
- Shows guest name only (privacy-focused)
- No detailed criteria, just overall impression

### **3. Cumulative Ratings**
- ✅ All ratings are stored cumulatively in the database
- ✅ Host ratings update `HostProfile.ratingAvg` and `HostProfile.ratingCount`
- ✅ Guest ratings update `GuestProfile.ratingAvg` and `GuestProfile.ratingCount`
- ✅ Real-time recalculation after each new rating

### **4. User Interface**

#### **My Bookings Page**
- ✅ "Rate Event" button appears on all past events
- ✅ Button links to dedicated rating page

#### **Rating Page** (`/events/[eventId]/rate`)
- ✅ Automatic eligibility check on page load
- ✅ Shows host information (name, venue)
- ✅ Shows list of co-guests who attended
- ✅ Interactive 5-star rating system
- ✅ Separate forms for host and co-guest ratings
- ✅ Visual feedback for already-rated users
- ✅ Success/error messages
- ✅ Navigation back to bookings

---

## 🗄️ DATABASE CHANGES

### **Updated Feedback Model**
```typescript
{
  eventSlotId: ObjectId,
  bookingId: ObjectId,
  fromUserId: ObjectId,
  toUserId: ObjectId,
  
  feedbackType: "HOST" | "GUEST",  // NEW: Distinguish rating type
  rating: Number (1-5),             // Overall rating
  
  // Host ratings (4 criteria)
  eventRating: Number (0-5),        // NEW
  venueRating: Number (0-5),        // NEW
  foodRating: Number (0-5),         // NEW
  hospitalityRating: Number (0-5),  // NEW
  
  // Co-guest rating
  guestRating: Number (0-5),        // NEW
  
  comment: String,
  isVerifiedAttendance: Boolean,
  
  timestamps: true
}
```

**Indexes:**
- `(eventSlotId, fromUserId, toUserId)` - Unique, prevents duplicate ratings
- `toUserId` - For fetching user's received ratings
- `eventSlotId` - For event-level queries

---

## 🔌 API ENDPOINTS

### **1. Check Eligibility**
```
GET /api/feedback/check-eligibility?eventSlotId=<id>
```

**Response:**
```json
{
  "canRate": true,
  "bookingId": "...",
  "host": {
    "userId": "...",
    "hostName": "John Doe",
    "venueName": "John's Kitchen",
    "alreadyRated": false
  },
  "coGuests": [
    {
      "userId": "...",
      "guestName": "Jane Smith",
      "alreadyRated": false
    }
  ]
}
```

**Checks:**
- Event is completed (past `endAt` time)
- User has confirmed booking
- Returns host and co-guest details
- Shows which users are already rated

### **2. Submit Rating**
```
POST /api/feedback/submit
```

**Host Rating Body:**
```json
{
  "type": "HOST",
  "eventSlotId": "...",
  "bookingId": "...",
  "hostUserId": "...",
  "eventRating": 5,
  "venueRating": 4,
  "foodRating": 5,
  "hospitalityRating": 5,
  "comment": "Great experience!"
}
```

**Guest Rating Body:**
```json
{
  "type": "GUEST",
  "eventSlotId": "...",
  "bookingId": "...",
  "toGuestUserId": "...",
  "rating": 4,
  "comment": "Friendly guest"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Rating submitted successfully"
}
```

---

## 📊 RATING CALCULATIONS

### **Host Rating**
1. Each guest rates host on 4 criteria (event, venue, food, hospitality)
2. Overall rating for that submission = Average of 4 criteria
3. Host's cumulative rating = Average of all host ratings received
4. Updated in `HostProfile.ratingAvg` and `HostProfile.ratingCount`

**Example:**
- Guest A rates: Event=5, Venue=4, Food=5, Hospitality=5 → Overall=4.75
- Guest B rates: Event=4, Venue=4, Food=4, Hospitality=5 → Overall=4.25
- **Host's cumulative rating = (4.75 + 4.25) / 2 = 4.5**

### **Guest Rating**
1. Each co-guest can rate each other with simple star rating
2. Guest's cumulative rating = Average of all guest ratings received
3. Updated in `GuestProfile.ratingAvg` and `GuestProfile.ratingCount`

**Example:**
- 3 guests rate Guest A: 5, 4, 5
- **Guest A's cumulative rating = (5 + 4 + 5) / 3 = 4.67**

---

## 🛡️ SECURITY & VALIDATION

### **Eligibility Checks**
- ✅ Must be authenticated
- ✅ Event must be completed (past end time)
- ✅ Must have confirmed/completed booking
- ✅ Cannot rate if already rated (unique constraint)

### **Validation**
- ✅ All ratings must be 1-5 stars
- ✅ Host ratings require all 4 criteria
- ✅ Guest ratings require star selection
- ✅ Zod schema validation on API

### **Privacy**
- ✅ Co-guests only see names (no contact info)
- ✅ Ratings are tied to verified attendance
- ✅ Cannot rate self
- ✅ Cannot rate without attending

---

## 🎨 UI/UX FEATURES

### **Interactive Star Rating**
- ✅ Click to select 1-5 stars
- ✅ Visual hover effects
- ✅ Yellow color for selected stars
- ✅ Gray for unselected

### **Status Indicators**
- ✅ "Already rated ✓" for completed ratings
- ✅ Disabled buttons for already-rated users
- ✅ Success messages on submission
- ✅ Error messages for failures

### **Navigation**
- ✅ "Rate Event" button in My Bookings (past events)
- ✅ "Back to My Bookings" on rating page
- ✅ Auto-refresh after submission

---

## 📝 USER FLOW

### **Guest Journey:**
1. Navigate to "My Bookings" page
2. Find a completed (past) event
3. Click "⭐ Rate Event" button
4. System checks eligibility:
   - Is event completed? ✓
   - Did user attend? ✓
5. Rating page loads with:
   - Host rating form (4 criteria)
   - List of co-guests to rate
6. Guest fills out host ratings (all 4 required)
7. Click "Submit Host Rating"
8. Success! Rating stored, host's cumulative rating updated
9. Guest then rates co-guests (optional)
10. Each co-guest rated individually
11. Success! Guest ratings stored, co-guests' cumulative ratings updated
12. Navigate back to bookings

---

## 🔄 SERVICE FUNCTIONS

### **feedbackService.ts**

#### `isEventCompleted(eventSlotId)`
- Checks if event end time has passed
- Returns boolean

#### `canRateEvent(guestUserId, eventSlotId)`
- Comprehensive eligibility check
- Returns `{ canRate, reason?, bookingId? }`

#### `getCoGuestsForRating(guestUserId, eventSlotId)`
- Fetches all co-guests who attended
- Excludes current user
- Shows already-rated status
- Returns array of `{ userId, guestName, alreadyRated }`

#### `getHostForRating(guestUserId, eventSlotId)`
- Fetches host details
- Shows venue name
- Shows already-rated status
- Returns `{ userId, hostName, venueName, alreadyRated }`

#### `submitHostRating(data)`
- Validates all 4 criteria provided
- Calculates overall rating
- Prevents duplicate ratings
- Updates `HostProfile` cumulative rating
- Returns `{ success, message }`

#### `submitGuestRating(data)`
- Validates rating
- Prevents duplicate ratings
- Updates `GuestProfile` cumulative rating
- Returns `{ success, message }`

#### `updateHostCumulativeRating(hostUserId)`
- Fetches all host ratings (feedbackType="HOST")
- Calculates average
- Updates `HostProfile.ratingAvg` and `ratingCount`

#### `updateGuestCumulativeRating(guestUserId)`
- Fetches all guest ratings (feedbackType="GUEST")
- Calculates average
- Updates `GuestProfile.ratingAvg` and `ratingCount`

---

## ✅ BUILD STATUS
**Status:** ✅ **PASSING**
- All TypeScript compilation successful
- No linter errors
- All routes created
- Database models updated

---

## 🚀 DEPLOYMENT READY
- All API endpoints functional
- Database schema updated
- UI components complete
- Error handling in place
- Validation implemented
- Security checks active

---

## 📈 FUTURE ENHANCEMENTS (Optional)

### Possible additions:
1. **Photo Reviews** - Allow guests to upload photos with ratings
2. **Helpful Votes** - Other users can mark reviews as helpful
3. **Detailed Review Comments** - Rich text comments
4. **Review Moderation** - Flag inappropriate reviews
5. **Reply to Reviews** - Hosts can respond to guest reviews
6. **Review Summary** - Show statistics (% recommend, common words)
7. **Review Filters** - Filter by rating, date, event type
8. **Email Notifications** - Notify users when they receive ratings
9. **Rating Badges** - "Top Rated Host", "5-Star Guest"
10. **Review Incentives** - Reward users for leaving reviews
