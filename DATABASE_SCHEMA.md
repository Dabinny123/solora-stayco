# Solora StayCo - Database Schema Documentation

## Overview

This document describes the Firestore database structure for Solora StayCo. All collections use Firestore's document-based NoSQL structure.

---

## Collections

### 1. `users`

**Description**: User accounts and profiles

**Document ID**: Firebase Auth UID

**Fields**:
```javascript
{
  uid: string,                    // Firebase Auth UID (same as document ID)
  email: string,                  // User email
  displayName: string,            // User's display name
  role: string,                   // 'guest', 'host', or 'admin'
  emailVerified: boolean,         // Email verification status
  profilePhoto: string | null,    // URL to profile photo
  phoneNumber: string | null,     // Phone number
  createdAt: timestamp,           // Account creation date
  updatedAt: timestamp,           // Last update date
  
  // Guest-specific
  preferences: {
    favoriteCategories: string[], // ['Home', 'Experience', 'Service']
    savedListings: string[],      // Array of listing IDs
    bookingHistory: string[],     // Array of booking IDs
  },
  
  // Host-specific
  hostInfo: {
    isVerified: boolean,          // Host verification status
    totalListings: number,        // Total listings created
    totalBookings: number,        // Total bookings received
    rating: number,               // Average rating
    responseRate: number,         // Response rate percentage
  },
  
  // Points & Rewards
  points: number,                 // User points balance
  rewards: array,                 // Array of reward objects
}
```

**Indexes Required**:
- `role` (for filtering by role)
- `createdAt` (for sorting)

---

### 2. `listings`

**Description**: Property/experience listings

**Document ID**: Auto-generated

**Fields**:
```javascript
{
  id: string,                     // Document ID
  hostId: string,                 // Reference to users collection
  title: string,                  // Listing title
  description: string,            // Full description
  category: string,               // 'Home', 'Experience', 'Service'
  type: string,                   // e.g., 'Apartment', 'House', 'Villa'
  
  // Location
  location: {
    address: string,
    city: string,
    state: string,
    country: string,
    zipCode: string,
    coordinates: {
      lat: number,
      lng: number,
    },
  },
  
  // Pricing
  basePrice: number,              // Price per night
  currency: string,               // 'USD', etc.
  cleaningFee: number,
  serviceFee: number,             // Platform service fee
  securityDeposit: number,
  
  // Promotions & Discounts
  promotions: array,              // Array of promotion objects
  discounts: {
    weekly: number,               // Percentage discount
    monthly: number,
    longTerm: number,
  },
  
  // Media
  photos: string[],               // Array of photo URLs
  featuredPhoto: string | null,   // Main photo URL
  
  // Amenities
  amenities: string[],            // Array of amenity strings
  
  // Capacity
  maxGuests: number,
  bedrooms: number,
  beds: number,
  bathrooms: number,
  
  // Availability
  status: string,                 // 'draft', 'active', 'inactive', 'suspended'
  availability: {
    startDate: timestamp | null,
    endDate: timestamp | null,
    blockedDates: array,          // Array of date ranges
  },
  
  // Calendar
  calendar: {
    availableDates: array,        // Array of available date ranges
    bookedDates: array,           // Array of booked date ranges
  },
  
  // Reviews & Ratings
  rating: number,                 // Average rating (0-5)
  totalReviews: number,
  
  // Metadata
  createdAt: timestamp,
  updatedAt: timestamp,
  publishedAt: timestamp | null,
  views: number,                  // View count
  favorites: number,              // Favorite count
}
```

**Indexes Required**:
- `hostId` (for host's listings)
- `status` (for active listings)
- `category` (for filtering by category)
- `location.city` (for location search)
- `basePrice` (for price filtering)
- `rating` (for sorting by rating)
- `createdAt` (for sorting)

---

### 3. `bookings`

**Description**: Booking reservations

**Document ID**: Auto-generated

**Fields**:
```javascript
{
  id: string,                     // Document ID
  listingId: string,              // Reference to listings collection
  guestId: string,                // Reference to users collection
  hostId: string,                 // Reference to users collection
  
  // Dates
  checkIn: timestamp,             // Check-in date
  checkOut: timestamp,            // Check-out date
  numberOfNights: number,
  
  // Guests
  numberOfGuests: number,
  guestDetails: {
    name: string,
    email: string,
    phone: string,
    specialRequests: string,
  },
  
  // Pricing
  basePrice: number,
  cleaningFee: number,
  serviceFee: number,
  securityDeposit: number,
  discount: number,
  totalAmount: number,
  currency: string,
  
  // Payment
  paymentStatus: string,          // 'pending', 'paid', 'refunded', 'failed'
  paymentMethod: string,          // 'e-wallet', 'card', etc.
  paymentId: string | null,       // Reference to payments collection
  paidAt: timestamp | null,
  
  // Status
  status: string,                 // 'pending', 'confirmed', 'cancelled', 'completed', 'refunded'
  cancellationReason: string | null,
  cancelledAt: timestamp | null,
  cancelledBy: string | null,     // 'guest' or 'host'
  
  // Timeline
  createdAt: timestamp,
  confirmedAt: timestamp | null,
  completedAt: timestamp | null,
  
  // Reviews
  guestReviewId: string | null,   // Reference to reviews collection
  hostReviewId: string | null,    // Reference to reviews collection
}
```

**Indexes Required**:
- `listingId` (for listing's bookings)
- `guestId` (for guest's bookings)
- `hostId` (for host's bookings)
- `status` (for filtering by status)
- `checkIn` (for date filtering)
- `createdAt` (for sorting)

---

### 4. `reviews`

**Description**: Reviews and ratings

**Document ID**: Auto-generated

**Fields**:
```javascript
{
  id: string,                     // Document ID
  listingId: string,              // Reference to listings collection
  bookingId: string,              // Reference to bookings collection
  userId: string,                 // Reference to users collection (reviewer)
  targetUserId: string,           // Reference to users collection (being reviewed)
  type: string,                   // 'guest' or 'host'
  
  // Ratings (1-5)
  rating: number,                 // Overall rating
  cleanliness: number,
  communication: number,
  checkIn: number,
  accuracy: number,
  location: number,
  value: number,
  
  // Review Content
  title: string,
  comment: string,
  photos: string[],               // Array of photo URLs
  
  // Status
  status: string,                 // 'published', 'hidden', 'flagged'
  
  // Metadata
  createdAt: timestamp,
  updatedAt: timestamp,
  helpful: number,                // Helpful votes count
}
```

**Indexes Required**:
- `listingId` (for listing's reviews)
- `userId` (for user's reviews)
- `targetUserId` (for reviews about user)
- `rating` (for sorting by rating)
- `status` (for filtering published reviews)
- `createdAt` (for sorting)

---

### 5. `messages`

**Description**: User messages and conversations

**Document ID**: Auto-generated

**Fields**:
```javascript
{
  id: string,                     // Document ID
  conversationId: string,         // Groups messages by conversation
  senderId: string,               // Reference to users collection
  receiverId: string,             // Reference to users collection
  listingId: string | null,       // Optional: Reference to listings collection
  
  // Message Content
  content: string,
  type: string,                   // 'text', 'image', 'file'
  attachments: string[],          // Array of file URLs
  
  // Status
  read: boolean,
  readAt: timestamp | null,
  
  // Metadata
  createdAt: timestamp,
}
```

**Indexes Required**:
- `conversationId` (for conversation messages)
- `senderId` (for sent messages)
- `receiverId` (for received messages)
- `read` (for unread messages)
- `createdAt` (for sorting)

---

### 6. `payments`
### 7. `wallet_transactions`

**Description**: Records every e-wallet transaction for transparency.

**Fields**:
```javascript
{
  userId: string,
  type: 'deposit' | 'withdrawal',
  amount: number,
  balanceBefore: number,
  balanceAfter: number,
  method: string,
  description: string,
  referenceId: string | null,
  status: 'pending' | 'completed' | 'failed',
  createdAt: timestamp,
}
```

---

### 8. `settings`

> Stores global platform settings (e.g., service fee). Already configured in earlier steps; unchanged.

---

### 9. `moods`

**Description**: Defines the mood presets used by the mood-based booking system.

**Note**: Admin-managed via `/admin/moods`.

**Fields**:
```javascript
{
  name: string,
  description: string,
  coverImage: string,
  ambienceTags: string[],
  lighting: string[],
  colorPalettes: string[],
  emotions: string[],
  sortOrder: number,
  isActive: boolean,
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

---

### 10. `notifications`

**Description**: Stores notifications for hosts, guests, and admins.

**Fields**:
```javascript
{
  userId: string,
  type: string,
  title: string,
  message: string,
  metadata: object,
  isRead: boolean,
  readAt: timestamp | null,
  createdAt: timestamp,
}
```

---

### 11. `adminControls`

**Description**: Stores admin-configurable settings (service fee, mood overrides, announcements).

**Fields**:
```javascript
{
  type: string,
  data: object,
  createdBy: string,
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

---

**Description**: Payment transactions

**Document ID**: Auto-generated

**Fields**:
```javascript
{
  id: string,                     // Document ID
  userId: string,                 // Reference to users collection
  bookingId: string,              // Reference to bookings collection
  
  // Amount
  amount: number,
  currency: string,
  fees: {
    serviceFee: number,
    processingFee: number,
  },
  totalAmount: number,
  
  // Payment Method
  method: string,                 // 'e-wallet', 'card', 'bank_transfer'
  eWalletId: string | null,       // If using e-wallet
  transactionId: string,          // External transaction ID
  
  // Status
  status: string,                 // 'pending', 'processing', 'completed', 'failed', 'refunded'
  
  // Timeline
  createdAt: timestamp,
  processedAt: timestamp | null,
  completedAt: timestamp | null,
  
  // Refund
  refundAmount: number,
  refundedAt: timestamp | null,
  refundReason: string | null,
}
```

**Indexes Required**:
- `userId` (for user's payments)
- `bookingId` (for booking's payment)
- `status` (for filtering by status)
- `createdAt` (for sorting)

---

## Data Relationships

```
users (1) ──< (many) listings
users (1) ──< (many) bookings (as guest)
users (1) ──< (many) bookings (as host)
listings (1) ──< (many) bookings
listings (1) ──< (many) reviews
bookings (1) ──< (1) payments
bookings (1) ──< (2) reviews (guest review + host review)
users (1) ──< (many) messages (as sender)
users (1) ──< (many) messages (as receiver)
```

---

## Security Rules

See `firestore.rules` for detailed security rules. Key points:

- **Users**: Can read any user, but only update their own
- **Listings**: Public read, only hosts can create/update their own
- **Bookings**: Users can only read their own bookings
- **Reviews**: Public read, only guests can create
- **Messages**: Users can only read messages they're part of
- **Payments**: Users can only read their own payments

---

## Indexes

Create the following composite indexes in Firebase Console:

1. `listings`: `status` + `category` + `createdAt`
2. `listings`: `status` + `location.city` + `basePrice`
3. `bookings`: `hostId` + `status` + `checkIn`
4. `bookings`: `guestId` + `status` + `createdAt`
5. `reviews`: `listingId` + `status` + `createdAt`
6. `messages`: `conversationId` + `createdAt`

---

## Notes

- All timestamps use Firestore `serverTimestamp()` for consistency
- Document IDs are auto-generated except for `users` (uses Firebase Auth UID)
- Arrays are used for simple lists; subcollections are not used in this design
- All monetary values are stored as numbers (cents or smallest currency unit recommended)

