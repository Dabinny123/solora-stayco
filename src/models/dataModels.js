// Data Models for Solora StayCo Firestore Collections

/**
 * User Model
 * Collection: users
 */
export const UserModel = {
  uid: '', // Firebase Auth UID (document ID)
  email: '',
  displayName: '',
  role: 'guest', // 'guest', 'host', 'admin'
  emailVerified: false,
  profilePhoto: null, // URL string
  phoneNumber: null, // string
  createdAt: null, // Timestamp
  updatedAt: null, // Timestamp
  // Guest-specific fields
  preferences: {
    favoriteCategories: [], // ['Home', 'Experience', 'Service']
    savedListings: [], // Array of listing IDs
    bookingHistory: [], // Array of booking IDs
  },
  // Host-specific fields
  hostInfo: {
    isVerified: false,
    totalListings: 0,
    totalBookings: 0,
    rating: 0, // Average rating
    responseRate: 0, // Percentage
  },
  // Points & Rewards
  points: 0,
  rewards: [], // Array of reward objects
  
  // E-Wallet
  walletBalance: 0, // E-wallet balance in currency units

  // Mood & Ambience Preferences
  moodPreferences: {
    favoriteMoods: [], // Array of mood IDs
    ambienceTags: [], // Derived ambience tags the user likes
    lastMoodSelected: null,
  },
  
  // PayPal Account Integration
  paypalAccount: {
    isConnected: false, // Boolean indicating if PayPal is connected
    email: null, // PayPal email address
    merchantId: null, // PayPal merchant ID
    connectedAt: null, // Timestamp when account was connected
  },
};

/**
 * Listing Model
 * Collection: listings
 */
export const ListingModel = {
  id: '', // Document ID
  hostId: '', // Reference to users collection
  title: '',
  description: '',
  category: 'Home', // 'Home', 'Experience', 'Service'
  type: '', // e.g., 'Apartment', 'House', 'Villa', 'Workshop', 'Tour'
  
  // Location
  location: {
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    coordinates: {
      lat: 0,
      lng: 0,
    },
  },
  
  // Pricing
  basePrice: 0, // Per night
  currency: 'USD',
  cleaningFee: 0,
  serviceFee: 0, // Platform service fee
  securityDeposit: 0,
  
  // Promotions & Discounts
  promotions: [], // Array of promotion objects
  discounts: {
    weekly: 0, // Percentage
    monthly: 0, // Percentage
    longTerm: 0, // Percentage
  },
  
  // Media
  photos: [], // Array of photo URLs
  featuredPhoto: null, // Main photo URL
  
  // Amenities
  amenities: [], // Array of amenity strings

  // Mood & Ambience Metadata
  moodTags: [], // Array of mood IDs
  ambienceTags: [], // Descriptive ambience tags
  lighting: 'neutral', // 'warm', 'cool', 'natural', etc.
  colorPalette: [], // e.g., ['earthy', 'pastel']
  aestheticScore: 0, // 0-100 score
  ambienceDescription: '', // Free text description
  moodHighlights: '', // Copy that describes the mood experience
  
  // Capacity
  maxGuests: 1,
  bedrooms: 0,
  beds: 0,
  bathrooms: 0,
  
  // Availability
  status: 'draft', // 'draft', 'active', 'inactive', 'suspended'
  availability: {
    startDate: null, // Timestamp
    endDate: null, // Timestamp
    blockedDates: [], // Array of date ranges
  },
  
  // Calendar
  calendar: {
    availableDates: [], // Array of available date ranges
    bookedDates: [], // Array of booked date ranges
  },
  
  // Reviews & Ratings
  rating: 0, // Average rating
  totalReviews: 0,
  
  // Metadata
  createdAt: null, // Timestamp
  updatedAt: null, // Timestamp
  publishedAt: null, // Timestamp
  views: 0,
  favorites: 0, // Number of users who favorited
};

/**
 * Booking Model
 * Collection: bookings
 */
export const BookingModel = {
  id: '', // Document ID
  listingId: '', // Reference to listings collection
  guestId: '', // Reference to users collection
  hostId: '', // Reference to users collection
  
  // Dates
  checkIn: null, // Timestamp
  checkOut: null, // Timestamp
  numberOfNights: 0,
  
  // Guests
  numberOfGuests: 1,
  guestDetails: {
    name: '',
    email: '',
    phone: '',
    specialRequests: '',
  },
  
  // Pricing
  basePrice: 0,
  cleaningFee: 0,
  serviceFee: 0,
  securityDeposit: 0,
  discount: 0,
  totalAmount: 0,
  currency: 'USD',
  
  // Payment
  paymentStatus: 'pending', // 'pending', 'paid', 'partial', 'refunded', 'failed'
  paymentMethod: '', // 'e-wallet', 'paypal', 'card', etc.
  paymentId: null, // Reference to payments collection
  paidAt: null, // Timestamp
  remainingBalance: 0, // Remaining balance if partial payment
  totalPaid: 0, // Total amount paid so far
  
  // Status
  status: 'pending', // 'pending', 'confirmed', 'cancelled', 'completed', 'refunded'
  cancellationReason: null,
  cancelledAt: null, // Timestamp
  
  // Timeline
  createdAt: null, // Timestamp
  confirmedAt: null, // Timestamp
  completedAt: null, // Timestamp
  
  // Reviews
  guestReviewId: null, // Reference to reviews collection
  hostReviewId: null, // Reference to reviews collection

  // Mood Metadata
  selectedMoodId: null, // Mood chosen during booking
  recommendationSource: null, // 'mood', 'search', 'recommendation'
};

/**
 * Review Model
 * Collection: reviews
 */
export const ReviewModel = {
  id: '', // Document ID
  listingId: '', // Reference to listings collection
  bookingId: '', // Reference to bookings collection
  userId: '', // Reference to users collection (reviewer)
  targetUserId: '', // Reference to users collection (being reviewed - host or guest)
  type: 'guest', // 'guest' (review by guest) or 'host' (review by host)
  
  // Ratings (1-5)
  rating: 0,
  cleanliness: 0,
  communication: 0,
  checkIn: 0,
  accuracy: 0,
  location: 0,
  value: 0,
  
  // Review Content
  title: '',
  comment: '',
  photos: [], // Array of photo URLs
  
  // Status
  status: 'published', // 'published', 'hidden', 'flagged'
  
  // Metadata
  createdAt: null, // Timestamp
  updatedAt: null, // Timestamp
  helpful: 0, // Number of helpful votes
};

/**
 * Message Model
 * Collection: messages
 */
export const MessageModel = {
  id: '', // Document ID
  conversationId: '', // Group messages by conversation
  senderId: '', // Reference to users collection
  receiverId: '', // Reference to users collection
  listingId: null, // Optional: Reference to listings collection
  
  // Message Content
  content: '',
  type: 'text', // 'text', 'image', 'file'
  attachments: [], // Array of file URLs
  
  // Status
  read: false,
  readAt: null, // Timestamp
  
  // Metadata
  createdAt: null, // Timestamp
};

/**
 * Payment Model
 * Collection: payments
 */
export const PaymentModel = {
  id: '', // Document ID
  userId: '', // Reference to users collection
  bookingId: '', // Reference to bookings collection
  hostId: '', // Reference to users collection (host)
  
  // Amount
  amount: 0, // Payment amount (can be partial)
  currency: 'USD',
  fees: {
    serviceFee: 0,
    processingFee: 0,
  },
  totalAmount: 0, // Total booking amount
  remainingBalance: 0, // Remaining balance if partial payment
  paymentType: 'full', // 'full', 'down', 'custom'
  isFullPayment: true, // Whether this is a full payment
  
  // Payment Method
  method: 'e-wallet', // 'e-wallet', 'paypal', 'card', 'bank_transfer'
  eWalletId: null, // If using e-wallet
  transactionId: '', // External transaction ID
  paypalOrderId: null, // PayPal order ID
  
  // Commission Split
  commission: {
    adminCommission: 0, // Admin/company commission
    hostEarnings: 0, // Host earnings
    totalAmount: 0, // Total booking amount
    paymentAmount: 0, // Amount paid in this transaction
    remainingBalance: 0, // Remaining balance
  },
  
  // Status
  status: 'pending', // 'pending', 'processing', 'completed', 'failed', 'refunded', 'partial'
  
  // Timeline
  createdAt: null, // Timestamp
  processedAt: null, // Timestamp
  completedAt: null, // Timestamp
  
  // Refund
  refundAmount: 0,
  refundedAt: null, // Timestamp
  refundReason: null,
};

/**
 * Promotion Model (embedded in Listing)
 */
export const PromotionModel = {
  id: '', // Unique ID for the promotion
  title: '',
  description: '',
  discountType: 'percentage', // 'percentage' or 'fixed'
  discountValue: 0, // Percentage or fixed amount
  startDate: null, // Timestamp
  endDate: null, // Timestamp
  minNights: 0, // Minimum nights required
  applicableDates: [], // Array of date ranges
  isActive: true,
};

/**
 * Calendar Event Model (for listing availability)
 */
export const CalendarEventModel = {
  date: null, // Timestamp (date only)
  listingId: '', // Reference to listings collection
  type: 'available', // 'available', 'blocked', 'booked'
  price: null, // Optional: Custom price for this date
  minNights: null, // Optional: Minimum nights for this date
};

/**
 * Mood Model
 * Collection: moods
 */
export const MoodModel = {
  id: '', // Document ID
  name: '', // e.g., 'Cozy & Warm'
  description: '',
  coverImage: '', // Optional hero image
  ambienceTags: [], // Tags related to ambience
  lighting: [], // Suggested lighting styles
  colorPalettes: [], // Suggested colors
  emotions: [], // Descriptive keywords
  sortOrder: 0, // For UI ordering
  isActive: true,
  createdAt: null,
  updatedAt: null,
};

/**
 * Admin Control Model
 * Collection: adminControls
 */
export const AdminControlModel = {
  id: '',
  type: '', // e.g., 'serviceFee', 'moods', 'alerts'
  data: {}, // Arbitrary JSON payload
  createdBy: '', // Admin user ID
  createdAt: null,
  updatedAt: null,
};

/**
 * Notification Model
 * Collection: notifications
 */
export const NotificationModel = {
  id: '',
  userId: '', // Recipient user ID
  type: '', // 'booking', 'payment', 'system', etc.
  title: '',
  message: '',
  metadata: {}, // Additional data (bookingId, etc.)
  isRead: false,
  readAt: null,
  createdAt: null,
};

