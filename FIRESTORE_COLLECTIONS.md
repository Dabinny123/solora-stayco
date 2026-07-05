# Firestore Collections - Complete List

## Overview

This document lists all Firestore collections needed for Solora StayCo. These collections will be created automatically when you start using the application, but you can also create them manually in Firebase Console.

---

## Required Collections

### 1. `users`

**Description**: User accounts and profiles

**Document ID**: Firebase Auth UID (automatically set when user signs up)

**Fields Structure**:
```javascript
{
  uid: string,                    // Firebase Auth UID
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
  
  // Host-specific (only if role is 'host')
  hostInfo: {
    isVerified: boolean,
    totalListings: number,
    totalBookings: number,
    rating: number,
    responseRate: number,
  },
  
  // Points & Rewards
  points: number,                 // User points balance
  rewards: array,                 // Array of reward objects
  
  // E-Wallet
  walletBalance: number,          // E-wallet balance
}
```

**Auto-created**: Yes (when user signs up)

---

### 2. `listings`

**Description**: Property/experience listings

**Document ID**: Auto-generated

**Fields Structure**:
```javascript
{
  id: string,                     // Document ID
  hostId: string,                 // Reference to users collection
  title: string,
  description: string,
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
  serviceFee: number,
  securityDeposit: number,
  
  // Promotions & Discounts
  promotions: array,
  discounts: {
    weekly: number,
    monthly: number,
    longTerm: number,
  },
  
  // Media
  photos: string[],               // Array of photo URLs
  featuredPhoto: string | null,
  
  // Amenities
  amenities: string[],
  
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
    blockedDates: array,
  },
  
  // Calendar
  calendar: {
    availableDates: array,
    bookedDates: array,
  },
  
  // Reviews & Ratings
  rating: number,                 // Average rating (0-5)
  totalReviews: number,
  
  // Metadata
  createdAt: timestamp,
  updatedAt: timestamp,
  publishedAt: timestamp | null,
  views: number,
  favorites: number,
}
```

**Auto-created**: Yes (when host creates listing)

---

### 3. `bookings`

**Description**: Booking reservations

**Document ID**: Auto-generated

**Fields Structure**:
```javascript
{
  id: string,                     // Document ID
  listingId: string,              // Reference to listings collection
  guestId: string,                // Reference to users collection
  hostId: string,                 // Reference to users collection
  
  // Dates
  checkIn: timestamp,
  checkOut: timestamp,
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
  hostReviewId: string | null,
}
```

**Auto-created**: Yes (when guest creates booking)

---

### 4. `reviews`

**Description**: Reviews and ratings

**Document ID**: Auto-generated

**Fields Structure**:
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

**Auto-created**: Yes (when user submits review)

---

### 5. `messages`

**Description**: User messages and conversations

**Document ID**: Auto-generated

**Fields Structure**:
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

**Auto-created**: Yes (when user sends message)

---

### 6. `payments`

**Description**: Payment transactions

**Document ID**: Auto-generated

**Fields Structure**:
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

**Auto-created**: Yes (when payment is created)

---

### 7. `wallet_transactions`

**Description**: E-wallet transactions

**Document ID**: Auto-generated

**Fields Structure**:
```javascript
{
  id: string,                     // Document ID
  userId: string,                 // Reference to users collection
  type: string,                   // 'deposit' or 'withdrawal'
  amount: number,                 // Positive for deposit, negative for withdrawal
  balanceBefore: number,          // Balance before transaction
  balanceAfter: number,           // Balance after transaction
  method: string,                 // 'card', 'e-wallet', etc.
  status: string,                 // 'completed', 'pending', 'failed'
  description: string,            // Transaction description
  referenceId: string | null,     // Reference to booking/payment ID
  createdAt: timestamp,
}
```

**Auto-created**: Yes (when wallet transaction occurs)

---

### 8. `settings`
### 9. `notifications`

**Description**: Stores user notifications (guests, hosts, admins)

**Document ID**: Auto-generated

**Fields**:
```javascript
{
  id: string,
  userId: string,                   // Recipient user ID
  type: string,                     // 'booking', 'payment', 'system', etc.
  title: string,
  message: string,
  metadata: object,                 // Extra info (bookingId, listingId, etc.)
  isRead: boolean,
  readAt: timestamp | null,
  createdAt: timestamp,
}
```

**Auto-created**: Yes (when events trigger notifications)

---

### 10. `adminControls`

**Description**: Stores platform-wide settings (service fee, mood definitions, announcements)

**Document ID**: Auto-generated (one per control type)

**Fields**:
```javascript
{
  id: string,
  type: string,                     // e.g., 'serviceFee', 'moodSettings'
  data: object,                     // Arbitrary JSON payload
  createdBy: string,                // Admin user ID
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

**Auto-created**: Yes (when admin updates settings)

---

### 11. `wishlist` *(optional)*

> Currently, wishlists are stored inside `users.preferences.savedListings`. Add this collection if you prefer a dedicated wishlist per user.

**Description**: Stores wishlist entries (one per user/listing pair)

**Document ID**: Auto-generated

**Fields**:
```javascript
{
  id: string,
  userId: string,
  listingId: string,
  createdAt: timestamp,
}
```

**Auto-created**: Only if implemented (optional)

---

### 12. `moods`

**Description**: Defines mood presets used for mood-based booking and recommendations

**Document ID**: Auto-generated

**Fields**:
```javascript
{
  id: string,
  name: string,                     // 'Cozy & Warm'
  description: string,
  coverImage: string | null,        // Optional hero image
  ambienceTags: string[],           // e.g., ['warm lighting', 'handcrafted']
  lighting: string[],               // Suggested lighting styles
  colorPalettes: string[],          // Suggested color palettes
  emotions: string[],               // Mood keywords
  sortOrder: number,
  isActive: boolean,
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

**Auto-created**: Yes (when admin adds moods)

---

**Description**: Platform settings and configuration

**Document ID**: Auto-generated (typically only one document)

**Fields Structure**:
```javascript
{
  id: string,                     // Document ID
  serviceFee: number,             // Platform service fee percentage
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

**Auto-created**: Yes (when admin sets service fee for first time)

**Note**: This collection typically has only one document with platform-wide settings.

---

## Summary Table

| Collection Name | Auto-Created | Primary Use | Key Fields |
|----------------|--------------|-------------|------------|
| `users` | ✅ Yes | User accounts | uid, email, role, walletBalance, points |
| `listings` | ✅ Yes | Property listings | hostId, title, status, basePrice, photos |
| `bookings` | ✅ Yes | Reservations | guestId, hostId, listingId, status, totalAmount, selectedMoodId |
| `reviews` | ✅ Yes | Reviews & ratings | listingId, userId, rating, comment |
| `messages` | ✅ Yes | User messages | senderId, receiverId, conversationId, content |
| `payments` | ✅ Yes | Payment records | userId, bookingId, status, totalAmount |
| `wallet_transactions` | ✅ Yes | E-wallet transactions | userId, type, amount, balanceAfter |
| `settings` | ✅ Yes | Platform settings | serviceFee |
| `moods` | ✅ Yes | Mood presets | name, ambienceTags, lighting |
| `notifications` | ✅ Yes | User notifications | userId, type, message |
| `adminControls` | ✅ Yes | Admin-configurable settings | type, data |

---

## How Collections Are Created

### Automatic Creation
All collections are created automatically when:
- **users**: User signs up
- **listings**: Host creates a listing
- **bookings**: Guest creates a booking
- **reviews**: User submits a review
- **messages**: User sends a message
- **payments**: Payment is processed
- **wallet_transactions**: Wallet transaction occurs
- **settings**: Admin sets service fee

### Manual Creation (Optional)
You can manually create empty collections in Firebase Console, but it's not necessary. Firestore will create them automatically when the first document is added.

---

## Firestore Indexes Required

Create these composite indexes in Firebase Console for optimal performance:

1. **listings**:
   - `status` + `category` + `createdAt`
   - `status` + `location.city` + `basePrice`
   - `hostId` + `status` + `createdAt`

2. **bookings**:
   - `hostId` + `status` + `checkIn`
   - `guestId` + `status` + `createdAt`
   - `listingId` + `status` + `checkIn`

3. **reviews**:
   - `listingId` + `status` + `createdAt`
   - `userId` + `createdAt`

4. **messages**:
   - `conversationId` + `createdAt`
   - `receiverId` + `read` + `createdAt`

5. **payments**:
   - `userId` + `status` + `createdAt`
   - `bookingId` + `status`

6. **wallet_transactions**:
   - `userId` + `createdAt`
   - `userId` + `type` + `createdAt`

---

## Security Rules

All collections have security rules defined in `firestore.rules`. Make sure to deploy these rules:

```bash
firebase deploy --only firestore:rules
```

---

## Testing Collections

To verify collections are working:

1. **Sign up a user** → Check `users` collection
2. **Create a listing** → Check `listings` collection
3. **Create a booking** → Check `bookings` collection
4. **Add funds to wallet** → Check `wallet_transactions` collection
5. **Set service fee** → Check `settings` collection

---

**Last Updated**: December 2024
**Version**: 1.0

