# DineAtHome Social - Complete Application Overview

## 📖 **Table of Contents**

1. [Executive Summary](#executive-summary)
2. [Vision & Mission](#vision--mission)
3. [Core Concept](#core-concept)
4. [Target Audience](#target-audience)
5. [Key Features](#key-features)
6. [User Roles & Workflows](#user-roles--workflows)
7. [Technical Architecture](#technical-architecture)
8. [Database Structure](#database-structure)
9. [API Architecture](#api-architecture)
10. [User Interface & Experience](#user-interface--experience)
11. [Security & Safety](#security--safety)
12. [Business Model](#business-model)
13. [Future Roadmap](#future-roadmap)

---

## 🎯 **Executive Summary**

**DineAtHome Social** is a community-driven platform that connects food lovers with home hosts, enabling authentic, intimate dining experiences in real homes. It transforms the way people socialize over food by combining the warmth of home cooking, the convenience of online booking, and the safety of verified hosts and guests.

**Tagline:** *"Home-hosted dining, made social."*

**Value Proposition:** 
- **For Guests:** Discover unique dining experiences, meet like-minded people, and enjoy authentic home-cooked meals in intimate settings.
- **For Hosts:** Share your culinary passion, earn income from your home kitchen, and build a community around your cooking.

---

## 🌟 **Vision & Mission**

### **Vision**
To become the world's most trusted platform for authentic, community-driven dining experiences, where every meal becomes a meaningful connection.

### **Mission**
In an era of digital connections, we believe the most meaningful relationships are built face-to-face, over shared meals. We're on a mission to:
- **Transform strangers into friends** through shared dining experiences
- **Celebrate authentic home cooking** and cultural heritage
- **Build a trusted community** of food lovers and passionate hosts
- **Make dining social** by connecting people with similar interests and dietary preferences

### **Core Values**
1. **🌟 Authenticity** - Real food, real homes, real connections
2. **🤲 Inclusivity** - Everyone deserves a seat at the table
3. **🔒 Safety** - Trust through transparency and verification
4. **💚 Sustainability** - Supporting local food systems and reducing waste

---

## 💡 **Core Concept**

### **What is DineAtHome Social?**

DineAtHome Social is a marketplace platform that enables:
- **Home hosts** to create and manage dining events in their homes
- **Food lovers** to discover and book seats at these intimate dining experiences
- **Community building** through shared meals, conversations, and cultural exchange

### **The Problem It Solves**

1. **Loneliness & Isolation:** People seek authentic connections beyond social media
2. **Cultural Barriers:** Limited opportunities to experience diverse cuisines and cultures
3. **Restaurant Fatigue:** Desire for home-cooked, authentic meals with personal touch
4. **Host Monetization:** Home cooks lack platform to share their skills and earn income
5. **Dietary Restrictions:** Difficulty finding events that accommodate specific needs
6. **Trust & Safety:** Need for verified, safe environment for in-home dining

### **The Solution**

A comprehensive platform that:
- ✅ **Verifies** all hosts and guests (ID verification, background checks)
- ✅ **Matches** users based on food preferences, dietary needs, and interests
- ✅ **Facilitates** secure booking and payment processing
- ✅ **Enables** two-way ratings and feedback systems
- ✅ **Ensures** safety through comprehensive checks and insurance

---

## 👥 **Target Audience**

### **Primary Users: 1. Guests (Food Lovers)**

**Demographics:**
- Age: 25-55 years
- Lifestyle: Urban professionals, food enthusiasts, cultural explorers
- Income: Middle to upper-middle class
- Location: Major cities (initially focusing on urban areas)

**Psychographics:**
- Value authentic experiences over convenience
- Interested in trying new cuisines and cultures
- Seeking meaningful social connections
- Prefer small-group, intimate settings
- Have specific dietary preferences or restrictions

**Pain Points:**
- Limited authentic dining options in restaurants
- Difficulty finding people with similar interests
- Dietary restrictions not always accommodated
- Restaurant experiences feel impersonal

**Benefits:**
- Discover unique home-cooked meals
- Meet like-minded people in small groups
- Dietary preferences respected and matched
- Safe, verified environment

---

### **Primary Users: 2. Hosts (Home Cooks)**

**Demographics:**
- Age: 28-65 years
- Lifestyle: Passionate home cooks, cultural ambassadors, community builders
- Location: Urban and suburban areas with accessible homes

**Psychographics:**
- Love sharing their culinary heritage
- Enjoy hosting and social interaction
- Want to monetize cooking skills
- Value community and cultural exchange
- Pride in home and cooking abilities

**Pain Points:**
- Cooking skills underutilized
- Limited opportunities to share cultural cuisine
- Want additional income source
- Desire recognition for culinary talents

**Benefits:**
- Earn income from home cooking
- Share cultural heritage through food
- Build community around cooking passion
- Flexible schedule and pricing control
- Receive feedback and improve skills

---

## ✨ **Key Features**

### **1. Event Discovery & Browsing**

**Public Event Listing:**
- Browse all upcoming events (no login required)
- Real-time event updates (no caching delays)
- Filter by:
  - **Location** (city, locality)
  - **Cuisine** (North Indian, Italian, Vegan, etc.)
  - **Food Tags** (VEG, NON_VEG, HALAL, KOSHER, etc.)
  - **Activities** (Board games, Karaoke, Music, etc.)
  - **Dietary Requirements** (Nut-free, Dairy-free, Gluten-free)
  - **Date & Time**
  - **Price Range**

**Event Display:**
- **Event Cards** with media slideshows (images/videos)
- Auto-sliding media carousel
- Host information and ratings
- Available seats indicator
- Price per guest
- Location and venue details

**Event Detail Pages:**
- Full event description
- Complete media gallery (images + videos)
- Host profile and ratings
- Venue information
- Cuisine, food served, activities, food tags
- Map integration
- Booking interface

---

### **2. Host Management**

**Registration & Onboarding:**
- Separate registration flow for hosts
- Venue setup (name, address, location)
- Profile creation (name, age, interests)
- Cuisine preferences selection
- Activities available at venue
- Map integration for address verification

**Event Creation:**
- **Event Details:**
  - Event name and theme
  - Date and time selection
  - Duration (hours)
  - Maximum guests capacity
  - Pricing per guest (paise)

- **Food Information:**
  - Food served description
  - Cuisine types (multiple)
  - Food tags (VEG/NON_VEG, ALCOHOL/NON_ALCOHOL)
  - Dietary certifications (HALAL, KOSHER, JAIN, VEGAN)

- **Activities:**
  - Available activities (Carrom, Cards, TV, Music, etc.)

- **Media Upload:**
  - Upload images during event creation
  - Upload videos during event creation
  - Media appears in event banner slideshow
  - Auto-sliding carousel display

**Event Management:**
- View past hosted events
- View upcoming events
- Guest list for each event
- Booking details and status
- Revenue tracking

**Venue Management:**
- Upload venue images
- Display venue photos on events
- Update venue information
- Manage venue details

---

### **3. Guest Experience**

**Registration & Profile:**
- Guest-specific registration
- Profile setup:
  - First and Last name
  - Age (0-99 dropdown)
  - Gender (Male/Female/Other)
  - Interests (comma-separated)

**Booking System:**
- **Simplified Booking Flow:**
  - "Book" button + "Number of seats" dropdown
  - Auto-populate primary guest details (from profile)
  - Add additional guests (up to 3 total seats per event)

- **Additional Guests:**
  - Name, Mobile, Age, Gender for each additional guest
  - Modal popup for guest details entry
  - Up to 3 total seats per event per guest account

- **Booking Limits:**
  - Maximum 3 seats per event per guest
  - Shows existing bookings if already booked
  - Displays remaining seats available
  - "Book More Seats" option for subsequent bookings

**Booking History:**
- View all past bookings (completed events only)
- Event details for each booking
- Rating option for completed events
- Booking status and payment information

---

### **4. Multi-Media Support**

**Event Media:**
- **Images:** Upload multiple images during event creation
- **Videos:** Upload videos during event creation
- **Auto-Slideshow:** Media automatically cycles in event banner
- **Event Cards:** Media displays in event list cards
- **Event Detail:** Full media gallery with navigation

**Venue Media:**
- Hosts upload venue images
- Venue photos displayed on event pages
- Gallery view of venue images

**Media Features:**
- Auto-sliding carousel (images change every 4-5 seconds)
- Video auto-play when active
- Navigation dots and arrows
- Responsive display across devices

---

### **5. Rating & Feedback System**

**Guest-to-Host Ratings:**
- Enabled after event completion (end time passed)
- **Rating Categories:**
  - Event Rating (1-5 stars)
  - Venue Rating (1-5 stars)
  - Food Rating (1-5 stars)
  - Hospitality Rating (1-5 stars)
  - Overall Rating (calculated average)

- **Co-Guest Ratings:**
  - Rate other guests who attended
  - Guest name display
  - Star rating (1-5)
  - Optional comments

- **Cumulative Ratings:**
  - Ratings aggregate across all events
  - Host profile shows average ratings
  - Builds reputation over time

**Host-to-Guest Ratings:**
- Hosts rate guests after event completion
- **Rating Categories (6):**
  1. ⏰ Punctuality
  2. 👔 Appearance
  3. 💬 Communication / Interaction
  4. 🤝 Behavior / Manners
  5. 🎯 Engagement in Activities
  6. ✨ Overall Presence

- **Additional Guests:**
  - Hosts can rate each additional guest separately
  - Ratings stored per guest (even without user account)
  - Full guest details (name, age, gender) displayed

- **UI Features:**
  - Collapsible event sections ("View Guest List")
  - Guest list with details
  - "⭐ Rate Guest" button for each guest
  - Rating modal with 6 category inputs
  - Existing ratings displayed (read-only)

---

### **6. Time-Based Event Filtering**

**Public Event View:**
- Only **upcoming events** displayed (endAt > now)
- Past events automatically hidden
- Real-time filtering as time passes

**Guest "My Bookings":**
- Only **past events** displayed (endAt < now)
- Completed events only
- Enables rating functionality

**Host "My Events":**
- Only **past events** displayed (endAt < now)
- Completed events only
- Enables guest rating functionality

---

### **7. Account Management**

**Unified Account Dropdown:**
- Single "Account" button in navigation
- Dropdown menu with:
  - Profile (all users)
  - My Bookings (Guests only)
  - My Events (Hosts only)
  - Logout

**Profile Management:**
- **Guests:**
  - Update name, age, gender
  - Manage interests
  - View booking history

- **Hosts:**
  - Update personal details
  - Manage venue information
  - Upload venue images
  - View event statistics

---

### **8. Become a Host Feature**

**Conditional Display:**
- "Become a Host" shown only to:
  - Logged-out users (redirects to host registration)
  - Guest users (shows modal)

- Hidden for:
  - Host users (already a host)
  - After guest registers as host

**Modal Functionality:**
- Creative modal for Guest users
- Informs about logout requirement
- Explains benefits of becoming a host
- "Continue as Host" / "Stay as Guest" buttons

---

### **9. Security & Verification**

**User Verification:**
- Government ID verification (Aadhaar/PAN)
- Identity verification status tracking
- Background checks for hosts
- Verification badges in UI

**Authentication:**
- JWT-based authentication
- Access tokens (short-lived)
- Refresh tokens (long-lived)
- Secure session management

**Authorization:**
- Role-based access control (Guest/Host/Admin)
- Endpoint protection
- Ownership verification for event operations
- Media upload restrictions (owner-only)

---

### **10. Payment Integration**

**Razorpay Integration:**
- Secure payment processing
- Webhook verification
- Order tracking
- Refund support

**Pricing:**
- Per-guest pricing
- Dynamic pricing by guest type (Basic/Premium/VIP)
- Price displayed in rupees (converted from paise)

---

## 👤 **User Roles & Workflows**

### **Role 1: Guest (Food Lover)**

**Registration Flow:**
1. Visit homepage
2. Click "Join now" or "Register"
3. Select "Guest" registration
4. Enter:
   - Email & Password
   - Mobile number
   - First Name & Last Name
   - Age (dropdown 0-99)
   - Gender (Male/Female/Other)
5. Complete profile setup
6. Redirected to explore events

**Booking Flow:**
1. Browse events (public listing)
2. Click on event card → View details
3. Select number of seats (1-3, max 3 per event)
4. If 1 seat: Auto-populate current user details
5. If 2+ seats: Add guest details via modal
6. Review booking summary
7. Click "Book" → Payment processing
8. Receive booking confirmation

**Post-Event Flow:**
1. Event completes (end time passes)
2. Navigate to "My Bookings" → See past events
3. Click "⭐ Rate Event"
4. Rate host on 4 categories + overall
5. Rate co-guests (if any)
6. Submit feedback

---

### **Role 2: Host (Home Cook)**

**Registration Flow:**
1. Visit homepage or "/host" page
2. Click "Become a Host"
3. Register as Host:
   - Email & Password
   - Mobile number
   - First Name & Last Name
   - Age
   - **Venue Name**
   - **Venue Address** (with map)
   - **Cuisines served** (comma-separated)
   - **Activities available** (comma-separated)
   - Interests
4. Complete profile
5. Redirected to host dashboard

**Event Creation Flow:**
1. Navigate to "/host/events/new"
2. Fill event form:
   - Event name, date, time, duration
   - Max guests, pricing
   - Food served, cuisines, activities
   - Food tags (VEG/NON_VEG, ALCOHOL/NON_ALCOHOL)
3. **Upload media** (optional):
   - Select images (multiple)
   - Select videos (multiple)
   - Preview before publishing
4. Click "Publish Event"
5. Event created → Media uploaded → Redirect to event detail
6. Event appears in public listing immediately

**Event Management Flow:**
1. Navigate to "My Events" (Account dropdown)
2. View past events (completed only)
3. Expand event → View guest list
4. See guest details:
   - Name, Age, Gender
   - Additional guests marked
   - Booking status
5. Rate guests:
   - Click "⭐ Rate Guest"
   - Rate on 6 categories
   - Add optional comment
   - Submit rating

**Media Management:**
1. View own event detail page
2. Scroll to "Event Media" section
3. Click "+ Add Media"
4. Select images/videos
5. Media uploads immediately
6. Delete media with hover button (owner-only)

---

### **Role 3: Admin (Platform Administrator)**

**Admin Capabilities:**
- User verification queues
- Account management
- Event moderation
- Reporting and analytics
- Pricing rule management
- Community moderation

---

## 🏗️ **Technical Architecture**

### **Technology Stack**

**Frontend:**
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Forms:** React Hook Form + Zod validation
- **State Management:** React Hooks (useState, useEffect)
- **UI Components:** Custom components (Button, Badge, Input, Select, Alert, Container)

**Backend:**
- **Runtime:** Node.js
- **Framework:** Next.js API Routes
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (jose library)
- **Password Hashing:** bcryptjs
- **File Storage:** Local filesystem (uploads directory)

**Services & Integrations:**
- **Payment:** Razorpay (test/production)
- **File Upload:** Custom upload endpoints
- **Image Serving:** Custom serve endpoint with security checks

**Development:**
- **Type Safety:** TypeScript throughout
- **Validation:** Zod schemas
- **Error Handling:** Custom response utilities
- **Environment:** Environment variables with Zod validation

---

### **Application Structure**

```
DineAtHome/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (public pages)
│   │   │   ├── page.tsx        # Homepage
│   │   │   ├── about/          # About page
│   │   │   ├── events/         # Events listing
│   │   │   │   └── [eventId]/  # Event detail + rating
│   │   │   ├── how-it-works/   # How it works page
│   │   │   └── communities/    # Communities page
│   │   │
│   │   ├── auth/               # Authentication pages
│   │   │   ├── login/
│   │   │   └── register/
│   │   │       ├── guest/
│   │   │       └── host/
│   │   │
│   │   ├── host/               # Host-specific pages
│   │   │   ├── page.tsx        # Host marketing page
│   │   │   ├── events/
│   │   │   │   ├── new/        # Create event
│   │   │   │   └── page.tsx    # Host events listing
│   │   │   └── my-events/      # Past events + guest ratings
│   │   │
│   │   ├── bookings/           # Guest bookings page
│   │   ├── profile/            # User profile page
│   │   ├── membership/         # Membership tiers page
│   │   └── api/                # API routes
│   │       ├── auth/           # Authentication APIs
│   │       ├── events/         # Event APIs (public)
│   │       ├── guest/          # Guest-specific APIs
│   │       ├── host/           # Host-specific APIs
│   │       ├── feedback/       # Rating/feedback APIs
│   │       ├── upload/         # Media upload APIs
│   │       └── me/             # Current user API
│   │
│   ├── server/                 # Server-side code
│   │   ├── models/             # Mongoose schemas
│   │   ├── services/           # Business logic
│   │   ├── auth/               # Authentication utilities
│   │   ├── db/                 # Database connection
│   │   └── http/               # HTTP response utilities
│   │
│   ├── components/             # React components
│   │   ├── ui/                 # UI components
│   │   ├── forms/              # Form components
│   │   ├── events/             # Event-related components
│   │   ├── modals/             # Modal components
│   │   └── account/            # Account components
│   │
│   └── lib/                    # Shared utilities
│       ├── http.ts             # API fetch utility
│       └── session.ts          # Session management
│
├── uploads/                    # Uploaded files (gitignored)
│   ├── event-images/
│   ├── event-videos/
│   └── venue-images/
│
└── server.js                   # Custom server entry point
```

---

## 🗄️ **Database Structure**

### **Core Collections**

#### **1. Users Collection**
```typescript
{
  _id: ObjectId
  email: string (unique, lowercase)
  mobile: string
  passwordHash: string (bcrypt)
  role: "GUEST" | "HOST" | "ADMIN"
  status: "PENDING" | "VERIFIED" | "ACTIVE" | "SUSPENDED"
  createdAt, updatedAt
}
```

#### **2. Venues Collection**
```typescript
{
  _id: ObjectId
  hostUserId: ObjectId (ref: User)
  name: string
  address: string
  description: string
  foodCategories: string[] (cuisines)
  gamesAvailable: string[] (activities)
  locality: string (indexed)
  geo: { type: "Point", coordinates: [lng, lat] } (2dsphere index)
  images: Array<{
    filePath: string
    fileMime: string
    fileName: string
    uploadedAt: Date
  }>
  createdAt, updatedAt
}
```

#### **3. EventSlots Collection**
```typescript
{
  _id: ObjectId
  hostUserId: ObjectId (ref: User, indexed)
  venueId: ObjectId (ref: Venue, indexed)
  eventName: string
  theme: string
  eventFormat: string (STANDARD, SPEED_DINING, etc.)
  eventCategory: string (SOCIAL, CORPORATE, etc.)
  startAt: Date (indexed)
  endAt: Date
  minGuests: number (default: 10)
  maxGuests: number
  seatsRemaining: number
  foodType: string
  cuisines: string[]
  foodTags: string[]
  gamesAvailable: string[]
  menuCourses: {
    starter, main, dessert, beverages, specialNotes
  }
  allergenFreeKitchen: string[]
  certifiedLabels: string[]
  basePricePerGuest: number (paise)
  earlyBirdPrice, lastMinutePrice, groupDiscountPercent
  priceByGuestType: { BASIC, PREMIUM, VIP }
  status: "OPEN" | "FULL" | "COMPLETED" | "CANCELLED"
  images: Array<{ filePath, fileMime, fileName, uploadedAt }>
  videos: Array<{ filePath, fileMime, fileName, uploadedAt }>
  waitlistEnabled, photoGalleryEnabled, chatEnabled
  isRecurring, recurringPattern
  isVirtualEvent, virtualEventLink
  createdAt, updatedAt
}
```

#### **4. Bookings Collection**
```typescript
{
  _id: ObjectId
  eventSlotId: ObjectId (ref: EventSlot, indexed)
  venueId: ObjectId (ref: Venue)
  hostUserId: ObjectId (ref: User, indexed)
  guestUserId: ObjectId (ref: User, indexed)
  guestTypeAtBooking: "BASIC" | "PREMIUM" | "VIP"
  seats: number (1-3)
  pricePerSeat: number
  amountTotal: number
  status: "PAYMENT_PENDING" | "CONFIRMED" | "CANCELLED" | "REFUND_REQUIRED"
  paymentId: ObjectId (ref: Payment)
  // Primary guest
  guestName, guestMobile, guestAge, guestGender
  // Additional guests (for multi-seat bookings)
  additionalGuests: Array<{
    name, mobile, age, gender
  }>
  // Ratings for additional guests (stored in booking)
  additionalGuestRatings: Array<{
    guestIndex, punctualityRating, appearanceRating,
    communicationRating, behaviorRating, engagementRating,
    overallPresenceRating, comment, ratedBy, ratedAt
  }>
  createdAt, updatedAt
}
```

#### **5. GuestProfiles Collection**
```typescript
{
  _id: ObjectId
  userId: ObjectId (ref: User, unique)
  firstName, lastName, gender, age
  interests: string[]
  foodPreferences: string[]
  allergies: string[]
  dietaryRestrictions: string[]
  guestType: "BASIC" | "PREMIUM" | "VIP"
  ratingAvg: number (cumulative)
  ratingCount: number
  walletBalance: number (paise)
  referralCode: string
  isIdentityVerified: boolean
  communities: ObjectId[] (ref: Community)
  createdAt, updatedAt
}
```

#### **6. HostProfiles Collection**
```typescript
{
  _id: ObjectId
  userId: ObjectId (ref: User, unique)
  venueId: ObjectId (ref: Venue)
  firstName, lastName, age
  interests: string[]
  bio: string
  hostTier: "STANDARD" | "VERIFIED_CHEF" | "TOP_RATED" | "CELEBRITY"
  isIdentityVerified, isCulinaryCertified, isBackgroundVerified
  ratingAvg, ratingCount
  totalEventsHosted, totalGuestsServed, totalRevenue
  commissionRate: number
  communities: ObjectId[] (ref: Community)
  autoAcceptBookings, cancellationPolicy
  profileImagePath, coverImagePath
  createdAt, updatedAt
}
```

#### **7. Feedback Collection**
```typescript
{
  _id: ObjectId
  eventSlotId: ObjectId (ref: EventSlot, indexed)
  bookingId: ObjectId (ref: Booking, indexed)
  fromUserId: ObjectId (ref: User, indexed)
  toUserId: ObjectId (ref: User, indexed)
  feedbackType: "HOST" | "GUEST" | "HOST_TO_GUEST"
  rating: number (1-5)
  comment: string
  // Host feedback (from guests)
  eventRating, venueRating, foodRating, hospitalityRating
  // Co-guest feedback
  guestRating
  // Host-to-guest ratings (6 categories)
  punctualityRating, appearanceRating, communicationRating,
  behaviorRating, engagementRating, overallPresenceRating
  createdAt, updatedAt
}
```

#### **8. Payments Collection**
```typescript
{
  _id: ObjectId
  bookingId: ObjectId (ref: Booking)
  razorpayOrderId: string
  razorpayPaymentId: string
  amount: number (paise)
  status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED"
  createdAt, updatedAt
}
```

#### **9. Additional Collections**
- **Communities:** Dining circles and groups
- **EventPhotos:** Photo galleries (future)
- **Waitlist:** Waitlist management (future)
- **EventTemplate:** Reusable event templates (future)
- **Referral:** Referral tracking (future)
- **AdminAction:** Admin action logs
- **PricingRule:** Dynamic pricing rules
- **ChatMessage:** Pre-event group chat (future)

---

## 🔌 **API Architecture**

### **Public APIs (No Authentication Required)**

#### **GET /api/events**
- **Purpose:** List all upcoming public events
- **Response:** Array of event objects
- **Caching:** Disabled (real-time updates)
- **Filters:** status="OPEN", endAt > now

#### **GET /api/events/[eventId]**
- **Purpose:** Get single event details
- **Response:** Full event object with media
- **Caching:** Disabled

#### **GET /api/upload/serve**
- **Purpose:** Serve uploaded media files
- **Parameters:** `path` (media file path)
- **Security:** Path traversal prevention

---

### **Guest APIs (Requires Guest Authentication)**

#### **POST /api/guest/bookings**
- **Purpose:** Create new booking
- **Validation:** Max 3 seats, guest details required
- **Body:** Event ID, seats, guest details, additional guests

#### **GET /api/guest/my-bookings**
- **Purpose:** Get guest's past bookings
- **Filter:** Only completed events (endAt < now)

#### **PUT /api/guest/profile**
- **Purpose:** Update guest profile
- **Fields:** Name, age, gender, interests

#### **GET /api/guest/account**
- **Purpose:** Get guest account overview
- **Response:** Profile + booking history + feedback given

---

### **Host APIs (Requires Host Authentication)**

#### **POST /api/host/events**
- **Purpose:** Create new event
- **Body:** Event details, pricing, food info, activities

#### **GET /api/host/events**
- **Purpose:** List host's events with bookings

#### **GET /api/host/my-events**
- **Purpose:** Get host's past events with guests
- **Filter:** Only completed events (endAt < now)

#### **PUT /api/host/profile**
- **Purpose:** Update host profile and venue
- **Fields:** Personal info, venue details, cuisines, activities

#### **POST /api/host/rate-guest**
- **Purpose:** Submit host-to-guest rating
- **Body:** Event ID, booking ID, guest ID, 6 ratings, comment
- **Support:** Additional guests via guestIndex

#### **GET /api/host/rate-guest**
- **Purpose:** Check rating eligibility and get existing rating
- **Query:** eventSlotId, guestUserId, bookingId, guestIndex

---

### **Upload APIs (Requires Authentication + Ownership)**

#### **POST /api/upload/event-media**
- **Purpose:** Upload event images/videos
- **Auth:** Host only, must own event
- **Body:** FormData with eventId, images[], videos[]

#### **DELETE /api/upload/event-media**
- **Purpose:** Delete event media
- **Auth:** Host only, must own event
- **Query:** eventId, mediaPath, mediaType

#### **POST /api/upload/venue-images**
- **Purpose:** Upload venue images
- **Auth:** Host only, owns venue

#### **DELETE /api/upload/venue-images**
- **Purpose:** Delete venue image
- **Auth:** Host only, owns venue

---

### **Feedback/Rating APIs**

#### **GET /api/feedback/check-eligibility**
- **Purpose:** Check if user can rate event
- **Auth:** Required
- **Query:** eventSlotId
- **Response:** { canRate, reason, coGuests, hostInfo }

#### **POST /api/feedback/submit**
- **Purpose:** Submit guest ratings (host or co-guest)
- **Auth:** Guest only
- **Body:** Event ID, rating type, ratings, comments

---

### **Authentication APIs**

#### **POST /api/auth/register**
- **Purpose:** User registration (Guest or Host)
- **Body:** Email, password, mobile, role, profile data

#### **POST /api/auth/login**
- **Purpose:** User login
- **Response:** Access token + refresh token

#### **POST /api/auth/refresh**
- **Purpose:** Refresh access token
- **Body:** Refresh token

#### **POST /api/auth/logout**
- **Purpose:** Logout (client-side token clearing)

#### **GET /api/me**
- **Purpose:** Get current user info
- **Auth:** Required
- **Response:** User details + profile

---

## 🎨 **User Interface & Experience**

### **Design System**

**Color Palette:**
- **Primary:** Gradient (coral → violet → sky)
- **Ink (Text):** Dark gray (#1a1a1a)
- **Sand (Background):** Light beige (#f5f0e8)
- **Success:** Green
- **Warning:** Amber/Yellow
- **Error:** Red

**Typography:**
- **Display Font:** Headings (large, bold)
- **Sans Font:** Body text (clean, readable)

**Components:**
- **Container:** Max-width containers with padding
- **Button:** Multiple variants (primary, outline, ghost)
- **Badge:** Status indicators and tags
- **Input:** Form inputs with validation
- **Select:** Dropdown selects
- **Alert:** Success/error messages
- **Card:** Content cards with shadows

**Styling:**
- **Rounded Corners:** 2xl-3xl (16-24px)
- **Shadows:** soft, card, 2xl variants
- **Backdrop Blur:** Glassmorphism effect
- **Transitions:** Smooth hover effects

---

### **Key Pages & Layouts**

#### **1. Homepage (`/`)**
**Sections:**
- Hero with tagline and CTAs
- Trust indicators (Verified, Payments, Matching)
- Featured events grid
- How it works (3 steps)
- For Guests vs For Hosts sections
- Final CTA section

#### **2. Events Listing (`/events`)**
**Features:**
- Event grid with cards
- Each card shows:
  - Media slideshow (images/videos)
  - Host info overlay
  - Event title, venue, locality
  - Price, seats left
  - Cuisine, food tags, activities badges
- Filter sidebar (future: functional)

#### **3. Event Detail (`/events/[eventId]`)**
**Layout:**
- Left column (main):
  - Media banner slideshow (images/videos)
  - Event information
  - Food served, Cuisine, Food tags, Activities
  - What's included section
  - Dietary & allergies section
  - About the host section
  - Reviews section
  - Media gallery (if host: add/delete options)

- Right column (sidebar):
  - Booking form
  - Price display
  - Existing booking info (if any)
  - Seat selection
  - Additional guest management
  - Book button

#### **4. Host Event Creation (`/host/events/new`)**
**Form Sections:**
- Event basic info (name, date, time, duration)
- Pricing (max guests, price per guest)
- Food details (food served, cuisines, activities)
- Food tags checkboxes
- Venue address display
- Map integration
- **Media upload section:**
  - Image upload (multiple)
  - Video upload (multiple)
  - Preview grid
  - Remove buttons

#### **5. Guest Bookings (`/bookings`)**
**Content:**
- Past events only (completed)
- Event cards with:
  - Event name, date, venue
  - Seats booked, amount paid
  - "⭐ Rate Event" button
  - Link to event detail

#### **6. Host My Events (`/host/my-events`)**
**Content:**
- Past events only (completed)
- Collapsible event cards
- "View Guest List" button
- Expanded guest list:
  - Guest name, age, gender
  - Additional guest badges
  - "⭐ Rate Guest" button
  - Rating modal (6 categories)

#### **7. Profile Page (`/profile`)**
**Content:**
- **Guests:**
  - Profile form (name, age, gender, interests)
  - Attended events list
  - Ratings given list

- **Hosts:**
  - Profile form (name, age, interests)
  - Venue form (name, address, cuisines, activities)
  - **Venue images section:**
    - Upload images
    - Image grid display
    - Delete buttons

---

## 🔒 **Security & Safety**

### **Authentication & Authorization**

**JWT-Based Authentication:**
- Access tokens (short-lived, 15 minutes)
- Refresh tokens (long-lived, 30 days)
- Secure token storage (localStorage)
- Token validation on each API request

**Role-Based Access Control (RBAC):**
- Guest, Host, Admin roles
- Endpoint protection with `requireAuth()` and `requireRole()`
- Ownership verification for event operations

**Password Security:**
- bcrypt hashing (10 rounds)
- Password never stored in plaintext
- Secure password validation (min 8 chars)

---

### **Data Protection**

**Input Validation:**
- Zod schemas for all API inputs
- Type safety with TypeScript
- Sanitization of user inputs
- SQL injection prevention (NoSQL, but safe practices)

**File Upload Security:**
- File type validation (images/videos only)
- Path traversal prevention
- File size limits (implicit)
- Unique filename generation
- Secure file serving

**API Security:**
- CORS configuration
- Request rate limiting (future)
- Error message sanitization
- No sensitive data in URLs

---

### **Verification & Trust**

**Host Verification:**
- Government ID verification (Aadhaar/PAN)
- Background checks (future)
- Kitchen safety certification (future)
- Verification status badges

**Guest Verification:**
- Identity verification (optional)
- Phone verification (future)
- Email verification (future)

**Event Safety:**
- Past events only shown in user-specific lists
- Rating only after event completion
- Booking confirmation required
- Secure payment processing

---

## 💰 **Business Model**

### **Revenue Streams**

**1. Commission-Based Model:**
- Platform takes commission from each booking (default: 15%)
- Commission rate varies by host tier
- Collected at booking confirmation

**2. Host Subscription (Future):**
- Premium host tiers
- Enhanced visibility
- Advanced analytics
- Priority support

**3. Guest Membership:**
- Basic (free)
- Premium (discounted bookings)
- VIP (exclusive events, priority booking)

**4. Additional Services (Future):**
- Photography services
- Event promotion
- Insurance coverage
- Equipment rentals

---

### **Pricing Structure**

**Host Earnings:**
- Set own pricing per guest
- Dynamic pricing by guest type
- Early bird discounts
- Group discounts
- Commission deducted automatically

**Guest Payments:**
- Pay per seat booked
- Pricing varies by guest type (Basic/Premium/VIP)
- Secure Razorpay integration
- Refund policies based on cancellation

---

## 🚀 **Future Roadmap**

### **Phase 1: Core Features (Current)**
✅ User registration (Guest/Host)
✅ Event creation and management
✅ Booking system
✅ Rating and feedback
✅ Media upload (images/videos)
✅ Public event browsing
✅ Profile management

### **Phase 2: Enhanced Features (Planned)**
- [ ] Advanced search and filtering
- [ ] Dietary matching algorithm
- [ ] Interest-based recommendations
- [ ] Pre-event group chat
- [ ] Photo galleries and contests
- [ ] Waitlist management
- [ ] Event templates
- [ ] Recurring events

### **Phase 3: Community Features (Planned)**
- [ ] Dining communities/circles
- [ ] Social networking features
- [ ] Friend connections
- [ ] Event sharing
- [ ] Reviews and testimonials
- [ ] Host achievements and badges

### **Phase 4: Monetization Features (Planned)**
- [ ] Subscription tiers
- [ ] Referral rewards
- [ ] Host tier system
- [ ] Premium features
- [ ] Analytics dashboard
- [ ] Marketing tools

### **Phase 5: Scale & Optimization (Planned)**
- [ ] Mobile app (React Native)
- [ ] Real-time notifications
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] International expansion
- [ ] Cloud storage for media
- [ ] CDN integration

---

## 📊 **Key Metrics & KPIs**

### **Platform Metrics**
- Total registered users (Guests + Hosts)
- Active hosts (hosted in last 30 days)
- Active guests (booked in last 30 days)
- Total events created
- Total bookings completed
- Average rating score
- Event completion rate

### **Host Metrics**
- Events hosted
- Total revenue generated
- Average booking rate
- Guest repeat rate
- Average rating received

### **Guest Metrics**
- Bookings made
- Events attended
- Ratings given
- Favorite cuisines
- Preferred event types

### **Safety Metrics**
- Verification completion rate
- Incident reports (future)
- Cancellation rate
- Refund rate

---

## 🌐 **Accessibility & Public Access**

### **Public Access**
- **Event browsing:** No login required
- **Event detail pages:** Fully accessible without login
- **Media viewing:** All event media visible to everyone
- **Real-time updates:** Events appear immediately after posting

### **Protected Features**
- Booking requires login (Guest)
- Rating requires login and event completion
- Event creation requires login (Host)
- Media upload requires ownership verification
- Profile management requires login

---

## 🎓 **Learning Resources**

### **For Developers**
- TypeScript throughout
- Next.js App Router patterns
- MongoDB/Mongoose schemas
- JWT authentication flow
- File upload handling
- Role-based access control

### **For Users**
- Comprehensive user guides (future)
- FAQ section (future)
- Video tutorials (future)
- Community forum (future)

---

## 📝 **Summary**

**DineAtHome Social** is a comprehensive, production-ready platform that bridges the gap between home cooking and social dining. It provides:

1. **For Guests:** Easy discovery of unique dining experiences with verified hosts, dietary matching, and secure booking
2. **For Hosts:** Complete toolkit to monetize home cooking, manage events, showcase venue/media, and build community
3. **For Platform:** Scalable architecture, robust security, real-time updates, and extensive feature set

**Key Differentiators:**
- ✅ **Verification-first approach** - Trust and safety built-in
- ✅ **Media-rich experiences** - Images and videos showcase events
- ✅ **Two-way ratings** - Hosts and guests rate each other
- ✅ **Dietary focus** - Comprehensive accommodation system
- ✅ **Ownership control** - Hosts fully control their events
- ✅ **Real-time visibility** - Events appear immediately
- ✅ **Public accessibility** - No barriers to browsing

**Technical Excellence:**
- Modern tech stack (Next.js 15, TypeScript, MongoDB)
- Clean architecture with separation of concerns
- Comprehensive API design
- Security-first approach
- Scalable database schema
- Responsive, modern UI

---

**Built with ❤️ for food lovers and passionate home cooks.**

*"Book a seat. Share a table."*
