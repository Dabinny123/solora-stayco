# Solora StayCo

A unique, curated aesthetic hotel booking and hosting platform with a focus on warm, minimalist, "signature" style accommodations.

## Project Overview

Solora StayCo is an online platform management system that provides:
- Mood-based search functionality
- High-quality photography showcase
- Personalized recommendations
- Guest, Host, and Admin dashboards
- E-wallet payments
- Points & rewards system

## Tech Stack

- **React 18** - UI library
- **React Router DOM** - Client-side routing
- **TailwindCSS** - Utility-first CSS framework
- **Firebase Authentication** - User authentication (email/password)
- **Firebase Hosting** - Web hosting
- **Cloud Firestore** - NoSQL database
- **Firebase Storage** - Photo and document storage
- **Firebase Analytics** - Usage analytics
- **Vite** - Build tool and dev server

## Project Structure

```
/
├── src/
│   ├── auth/              # Authentication services
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React contexts (Auth)
│   ├── firebase/          # Firebase services & config
│   ├── models/            # Data models
│   ├── pages/
│   │   ├── auth/         # Authentication pages
│   │   ├── guest/        # Guest-facing pages
│   │   ├── host/         # Host dashboard pages
│   │   └── admin/        # Admin panel pages
│   ├── services/          # Business logic services
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Application entry point
│   └── index.css         # Global styles
├── index.html            # HTML entry point
├── package.json          # Project dependencies
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # TailwindCSS configuration
├── firebase.json         # Firebase hosting configuration
├── firestore.rules       # Firestore security rules
└── storage.rules         # Storage security rules
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase CLI (for deployment)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

4. Deploy to Firebase:
```bash
npm run deploy
```

## Development Status

✅ **Complete** - All core features implemented and ready for testing

## Features Implemented

### ✅ Guest Features
- ✅ Account registration (email/password)
- ✅ Explore categories (Home, Experience, Service)
- ✅ View listings with photos, amenities, reviews
- ✅ Filter search (Where, Dates, Who, Price)
- ✅ Mood-based discovery with curated moods
- ✅ Favorites/Wishlist
- ✅ E-wallet payments
- ✅ Booking flow with confirmation
- ✅ Account Settings
- ✅ Transaction history

### ✅ Host Features
- ✅ Register account
- ✅ Create & manage listings
- ✅ Save listings as draft
- ✅ Add ambience metadata and mood tags
- ✅ Dashboard (Today, Upcoming, Stats)
- ✅ Messages/Inbox
- ✅ Booking management (Confirm/Cancel)
- ✅ Revenue tracking

### ✅ Admin Features
- ✅ Service fee control
- ✅ Analytics dashboards
- ✅ Policy & compliance pages
- ✅ Payment review and confirmation
- ✅ Reports generation
- ✅ User management
- ✅ Mood library management

### ✅ Additional Features
- ✅ Points & rewards system
- ✅ E-wallet balance management
- ✅ Real-time statistics
- ✅ Review system with ratings
- ✅ Responsive design

## Documentation

- **[User Manual](USER_MANUAL.md)** - Complete user guide
- **[Technical Documentation](TECHNICAL_DOCUMENTATION.md)** - Technical details and architecture
- **[Testing Guide](TESTING_GUIDE.md)** - Testing procedures and test cases
- **[Setup Guide](SETUP_GUIDE.md)** - Installation and setup instructions
- **[Database Schema](DATABASE_SCHEMA.md)** - Database structure documentation
- **[Deployment Guide](DEPLOYMENT.md)** - Firebase Hosting deployment instructions

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Deploy to Firebase**:
   ```bash
   firebase deploy
   ```

For detailed setup instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md)

## Testing

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for comprehensive testing procedures and test cases.

Target: 85% passing rate (IT-305 Final Requirements)

## License

ISC

---

**Project Status**: ✅ Complete - Ready for Testing & Deployment
**Last Updated**: December 2024

