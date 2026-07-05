# Solora StayCo - Technical Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Firebase Configuration](#firebase-configuration)
5. [Database Schema](#database-schema)
6. [Authentication](#authentication)
7. [Services & APIs](#services--apis)
8. [State Management](#state-management)
9. [Routing](#routing)
10. [Deployment](#deployment)

---

## Architecture Overview

Solora StayCo is built as a single-page application (SPA) using React and Firebase. The architecture follows a component-based structure with clear separation of concerns.

### Key Components
- **Frontend**: React 18 with React Router
- **Backend**: Firebase (Firestore, Authentication, Storage, Hosting)
- **Styling**: TailwindCSS
- **Build Tool**: Vite

---

## Technology Stack

### Frontend
- **React 18.2.0**: UI library
- **React Router DOM 6.21.0**: Client-side routing
- **TailwindCSS 3.4.0**: Utility-first CSS framework
- **Vite 5.0.8**: Build tool and dev server

### Backend (Firebase)
- **Firebase Authentication**: User authentication
- **Cloud Firestore**: NoSQL database
- **Firebase Storage**: File storage (images)
- **Firebase Hosting**: Web hosting
- **Firebase Analytics**: Usage analytics

### Development Tools
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing

---

## Project Structure

```
solora-stayco/
├── src/
│   ├── auth/                    # Authentication services
│   │   └── authService.js
│   ├── components/              # Reusable UI components
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   ├── ListingCard.jsx
│   │   ├── SearchFilters.jsx
│   │   └── ProtectedRoute.jsx
│   ├── contexts/                # React contexts
│   │   └── AuthContext.jsx
│   ├── firebase/                # Firebase configuration & services
│   │   ├── firebaseConfig.js
│   │   ├── firestoreService.js
│   │   ├── storageService.js
│   │   ├── roleService.js
│   │   ├── testConnection.js
│   │   └── index.js
│   ├── models/                  # Data models
│   │   └── dataModels.js
│   ├── pages/                   # Page components
│   │   ├── auth/
│   │   │   ├── SignIn.jsx
│   │   │   └── SignUp.jsx
│   │   ├── guest/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Explore.jsx
│   │   │   ├── ListingDetail.jsx
│   │   │   ├── Wishlist.jsx
│   │   │   ├── Booking.jsx
│   │   │   ├── BookingConfirmation.jsx
│   │   │   ├── Wallet.jsx
│   │   │   └── AccountSettings.jsx
│   │   ├── host/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── CreateListing.jsx
│   │   │   ├── MyListings.jsx
│   │   │   ├── Bookings.jsx
│   │   │   └── Messages.jsx
│   │   ├── admin/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ServiceFee.jsx
│   │   │   ├── Payments.jsx
│   │   │   ├── Users.jsx
│   │   │   └── Reports.jsx
│   │   ├── Home.jsx
│   │   └── Policy.jsx
│   ├── services/                # Business logic services
│   │   ├── listingsService.js
│   │   ├── bookingsService.js
│   │   ├── reviewsService.js
│   │   ├── messagesService.js
│   │   ├── paymentsService.js
│   │   ├── usersService.js
│   │   ├── walletService.js
│   │   └── rewardsService.js
│   ├── App.jsx                  # Main app component
│   ├── main.jsx                 # Entry point
│   └── index.css                # Global styles
├── public/                      # Static assets
├── index.html                   # HTML template
├── package.json                 # Dependencies
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # TailwindCSS configuration
├── postcss.config.js           # PostCSS configuration
├── firebase.json               # Firebase configuration
├── firestore.rules            # Firestore security rules
├── firestore.indexes.json     # Firestore indexes
├── storage.rules              # Storage security rules
└── README.md                   # Project readme
```

---

## Firebase Configuration

### Firebase Project Setup

1. **Project ID**: `solora-stayco`
2. **Authentication Domain**: `solora-stayco.firebaseapp.com`
3. **Storage Bucket**: `solora-stayco.firebasestorage.app`

### Configuration File

Located at `src/firebase/firebaseConfig.js`:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyArxRyFh7KTZA7a4RFQ77AEUz37Fl31mqI",
  authDomain: "solora-stayco.firebaseapp.com",
  projectId: "solora-stayco",
  storageBucket: "solora-stayco.firebasestorage.app",
  messagingSenderId: "1096556175014",
  appId: "1:1096556175014:web:7120049dde13e8ac409e67",
  measurementId: "G-6HWWBGEJ84"
};
```

### Services Initialized
- `auth`: Firebase Authentication
- `db`: Cloud Firestore
- `storage`: Firebase Storage
- `analytics`: Firebase Analytics

---

## Database Schema

See `DATABASE_SCHEMA.md` for detailed database structure.

### Collections
1. **users**: User accounts and profiles
2. **listings**: Property/experience listings
3. **bookings**: Booking reservations
4. **reviews**: Reviews and ratings
5. **messages**: User messages
6. **payments**: Payment transactions
7. **wallet_transactions**: E-wallet transactions
8. **settings**: Platform settings (service fee)

---

## Authentication

### Authentication Flow

1. **Sign Up**
   - User provides email, password, display name, and role
   - Firebase creates authentication account
   - User document created in Firestore
   - Email verification sent

2. **Sign In**
   - User provides email and password
   - Firebase authenticates
   - User data loaded from Firestore
   - Redirected to role-specific dashboard

3. **Sign Out**
   - Firebase signs out user
   - Auth state cleared
   - Redirected to home

### Role-Based Access Control

- **Guest**: Can browse, book, manage bookings
- **Host**: Can create listings, manage bookings, messages
- **Admin**: Full access to all features and admin panel

### Protected Routes

Routes are protected using `ProtectedRoute` component:
- Checks authentication status
- Validates user role if required
- Redirects unauthenticated users to sign in

---

## Services & APIs

### Authentication Service (`authService.js`)
- `signUp()`: Create new user account
- `signIn()`: Sign in existing user
- `signOutUser()`: Sign out current user
- `getCurrentUser()`: Get current authenticated user
- `getCurrentUserData()`: Get user data from Firestore
- `onAuthStateChange()`: Listen to auth state changes
- `resetPassword()`: Send password reset email
- `hasRole()`: Check user role

### Listings Service (`listingsService.js`)
- `createListing()`: Create new listing
- `updateListing()`: Update listing
- `deleteListing()`: Delete listing
- `getListing()`: Get listing by ID
- `getListingsByHost()`: Get host's listings
- `getActiveListings()`: Get active listings with filters
- `searchListingsByLocation()`: Search by location
- `getFeaturedListings()`: Get featured listings
- `incrementListingViews()`: Increment view count
- `toggleListingFavorite()`: Toggle favorite status

### Bookings Service (`bookingsService.js`)
- `createBooking()`: Create new booking
- `updateBooking()`: Update booking
- `getBooking()`: Get booking by ID
- `getBookingsByGuest()`: Get guest's bookings
- `getBookingsByHost()`: Get host's bookings
- `getBookingsByListing()`: Get listing's bookings
- `getUpcomingBookings()`: Get upcoming bookings
- `getTodayCheckIns()`: Get today's check-ins
- `confirmBooking()`: Confirm booking
- `cancelBooking()`: Cancel booking
- `completeBooking()`: Complete booking

### Reviews Service (`reviewsService.js`)
- `createReview()`: Create new review
- `updateReview()`: Update review
- `getReview()`: Get review by ID
- `getListingReviews()`: Get reviews for listing
- `getReviewsByUser()`: Get user's reviews
- `getBestReviews()`: Get best reviews
- `getLowestReviews()`: Get lowest reviews
- `updateListingRating()`: Update listing rating
- `markReviewHelpful()`: Mark review as helpful

### Messages Service (`messagesService.js`)
- `createMessage()`: Create new message
- `markMessageAsRead()`: Mark message as read
- `getMessage()`: Get message by ID
- `getConversationMessages()`: Get conversation messages
- `getUserConversations()`: Get user's conversations
- `getUnreadMessageCount()`: Get unread message count
- `markConversationAsRead()`: Mark conversation as read

### Payments Service (`paymentsService.js`)
- `createPayment()`: Create payment record
- `updatePayment()`: Update payment
- `getPayment()`: Get payment by ID
- `getPaymentsByUser()`: Get user's payments
- `getPaymentByBooking()`: Get payment for booking
- `completePayment()`: Complete payment
- `processPayment()`: Process payment
- `failPayment()`: Mark payment as failed
- `refundPayment()`: Process refund
- `getAllPayments()`: Get all payments (admin)

### Wallet Service (`walletService.js`)
- `getWalletBalance()`: Get wallet balance
- `addFunds()`: Add funds to wallet
- `deductFunds()`: Deduct funds from wallet
- `getWalletTransactions()`: Get transaction history
- `payWithWallet()`: Process payment with wallet

### Rewards Service (`rewardsService.js`)
- `awardBookingPoints()`: Award points for booking
- `awardReviewPoints()`: Award points for review
- `awardFirstBookingPoints()`: Award first booking bonus
- `getUserRewards()`: Get user points and rewards
- `redeemPoints()`: Redeem points for discount

### Moods Service (`moodsService.js`)
- `createMood()`: Add mood preset
- `updateMood()`: Update mood details
- `deleteMood()`: Remove mood
- `getMood()`: Fetch single mood
- `getAllMoods()`: List moods (active or all)

### Admin Controls Service (`adminControlsService.js`)
- `upsertAdminControl()`: Create/update control entries (service fee, mood settings)
- `getAdminControl()`: Fetch control by type
- `listAdminControls()`: List all controls
- `deleteAdminControl()`: Remove control entry

### Notifications Service (`notificationsService.js`)
- `createNotification()`: Create notification entry
- `markNotificationRead()`: Mark single notification as read
- `markAllNotificationsRead()`: Mark all notifications for a user as read
- `getNotifications()`: Fetch notifications for a user
- `deleteNotification()`: Delete notification

### Recommendation Service (`recommendationService.js`)
- `getMoodRecommendations()`: Return listings that match the user’s preferred moods

---

## State Management

### Authentication Context

`AuthContext` provides global authentication state:
- `currentUser`: Firebase user object
- `userData`: User data from Firestore
- `loading`: Loading state
- `isAuthenticated`: Boolean authentication status
- `isGuest`, `isHost`, `isAdmin`: Role checkers

### Usage

```javascript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { currentUser, userData, isAuthenticated } = useAuth();
  // Use auth state
}
```

---

## Routing

### Route Structure

**Public Routes**:
- `/`: Home page
- `/explore`: Browse listings
- `/listing/:id`: Listing detail
- `/signup`: Sign up
- `/signin`: Sign in
- `/policy/:type`: Policy pages

**Guest Routes** (Protected):
- `/guest/dashboard`: Guest dashboard
- `/guest/wishlist`: Wishlist
- `/guest/wallet`: E-wallet
- `/booking/:id`: Booking page
- `/booking/:id/confirmation`: Booking confirmation
- `/settings`: Account settings

**Host Routes** (Protected, Host role):
- `/host/dashboard`: Host dashboard
- `/host/listings`: Manage listings
- `/host/listings/create`: Create listing
- `/host/bookings`: Manage bookings
- `/host/messages`: Messages

**Admin Routes** (Protected, Admin role):
- `/admin/dashboard`: Admin dashboard
- `/admin/users`: User management
- `/admin/payments`: Payment review
- `/admin/service-fee`: Service fee control
- `/admin/reports`: Reports generation

---

## Deployment

### Firebase Hosting Setup

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase** (if not done):
   ```bash
   firebase init
   ```

4. **Build Project**:
   ```bash
   npm run build
   ```

5. **Deploy**:
   ```bash
   firebase deploy --only hosting
   ```

### Environment Variables

Currently, Firebase config is hardcoded. For production, consider using environment variables.

### Firestore Rules Deployment

```bash
firebase deploy --only firestore:rules
```

### Storage Rules Deployment

```bash
firebase deploy --only storage
```

---

## Security

### Firestore Security Rules

- Users can read any user, but only update their own
- Listings are publicly readable, only hosts can create/update
- Bookings are readable by involved parties only
- Reviews are publicly readable, only guests can create
- Messages are readable by conversation participants only
- Payments are readable by user or admin only

### Storage Security Rules

- User profile photos: Readable by all, writable by owner
- Listing photos: Readable by all, writable by hosts/admins
- Booking documents: Readable/writable by involved parties

---

## Performance Optimization

### Code Splitting
- React Router handles route-based code splitting
- Components loaded on demand

### Image Optimization
- Images stored in Firebase Storage
- Lazy loading for listing images
- Responsive image sizes

### Database Queries
- Indexed queries for common filters
- Pagination for large datasets
- Efficient data fetching

---

## Testing

See `TESTING_GUIDE.md` for comprehensive testing documentation.

---

## API Reference

All services are documented with JSDoc comments. Key functions include:
- Parameter types and descriptions
- Return value types
- Error handling
- Usage examples

---

## Contributing

1. Follow the existing code structure
2. Use consistent naming conventions
3. Add JSDoc comments for new functions
4. Test thoroughly before committing
5. Update documentation for new features

---

**Last Updated**: December 2024
**Version**: 1.0

