# Solora StayCo - Setup & Installation Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Firebase Setup](#firebase-setup)
4. [Configuration](#configuration)
5. [Running the Application](#running-the-application)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before setting up Solora StayCo, ensure you have the following installed:

### Required Software
- **Node.js**: Version 16 or higher
  - Download from: https://nodejs.org/
  - Verify installation: `node --version`
- **npm**: Comes with Node.js
  - Verify installation: `npm --version`
- **Git**: For version control (optional)
  - Download from: https://git-scm.com/

### Required Accounts
- **Firebase Account**: Free tier available
  - Sign up at: https://firebase.google.com/
- **Google Account**: For Firebase access

---

## Installation

### Step 1: Clone or Download Project

If using Git:
```bash
git clone <repository-url>
cd "Solora Stayco"
```

Or download and extract the project files.

### Step 2: Install Dependencies

Open terminal in the project directory and run:

```bash
npm install
```

This will install all required packages:
- React & React DOM
- React Router DOM
- Firebase SDK
- TailwindCSS & PostCSS
- Vite & plugins

**Expected time**: 1-3 minutes

### Step 3: Verify Installation

Check that `node_modules` folder was created and contains packages.

---

## Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `solora-stayco`
4. Follow setup wizard
5. Enable Google Analytics (optional)

### Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get started"
3. Enable **Email/Password** provider
4. Save

### Step 3: Create Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Start in **production mode** (we'll add rules)
4. Choose location (closest to your users)
5. Click "Enable"

### Step 4: Set Up Storage

1. Go to **Storage**
2. Click "Get started"
3. Start in **production mode**
4. Use same location as Firestore
5. Click "Done"

### Step 5: Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps"
3. Click web icon (`</>`)
4. Register app with nickname: "Solora StayCo Web"
5. Copy the Firebase configuration object

### Step 6: Update Firebase Config

The Firebase configuration is already set in `src/firebase/firebaseConfig.js`. If you're using a different Firebase project, update the config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

### Step 7: Deploy Security Rules

1. **Firestore Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Storage Rules**:
   ```bash
   firebase deploy --only storage
   ```

### Step 8: Create Firestore Indexes

1. Go to **Firestore Database** > **Indexes**
2. Create composite indexes as needed (see `DATABASE_SCHEMA.md`)
3. Or let Firebase create them automatically when you run queries

---

## Configuration

### Environment Variables (Optional)

For production, you may want to use environment variables:

1. Create `.env` or `.env.local` file in project root:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   ```

2. Update `firebaseConfig.js` to use environment variables if desired:
   ```javascript
   const firebaseConfig = {
     apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
     projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
     // ...
   };
   ```

If you don't configure env variables, the default `firebaseConfig.js` values are used.

### Email Verification Configuration

To ensure Firebase verification links are delivered and open on the right domain:

1. **Authorized Domains**  
   Go to **Firebase Console → Authentication → Settings → Authorized domains** and make sure these domains exist:
   - `localhost`
   - `solora-stayco.web.app`
   - Any custom domain you will use (e.g., `yourdomain.com`)

2. **Email Templates**  
   Under **Authentication → Templates → Email address verification**, customize the message if needed and click **Save** (Firebase only sends emails after the template is saved at least once).

3. **Optional Custom Redirect**  
   If you want the verification link to redirect somewhere other than `/verify-email`, set:
   ```
   VITE_EMAIL_VERIFICATION_REDIRECT=https://yourdomain.com/verify-email
   ```
   The URL **must** use one of the authorized domains from step 1.

### TailwindCSS Configuration

TailwindCSS is pre-configured. Customize in `tailwind.config.js`:
- Colors
- Fonts
- Spacing
- Breakpoints

---

## Running the Application

### Development Mode

1. **Start Development Server**:
   ```bash
   npm run dev
   ```

2. **Access Application**:
   - URL: `http://localhost:3000`
   - Browser should open automatically
   - Hot reload enabled (changes reflect immediately)

3. **Stop Server**:
   - Press `Ctrl + C` in terminal

### Production Build

1. **Build for Production**:
   ```bash
   npm run build
   ```

2. **Preview Production Build**:
   ```bash
   npm run preview
   ```

3. **Output**:
   - Built files in `dist/` folder
   - Optimized and minified
   - Ready for deployment

---

## Firebase Hosting Deployment

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

Follow browser prompts to authenticate.

### Step 3: Initialize Firebase (if not done)

```bash
firebase init
```

Select:
- **Hosting**: Configure files for Firebase Hosting
- **Use existing project**: Select `solora-stayco`
- **Public directory**: `dist`
- **Single-page app**: Yes
- **Overwrite index.html**: No

### Step 4: Build and Deploy

```bash
npm run build
firebase deploy --only hosting
```

### Step 5: Access Deployed Site

- Production URL: `https://solora-stayco.web.app`
- Alternative URL: `https://solora-stayco.firebaseapp.com`

---

## Initial Setup Tasks

### Create Admin User

**Method 1: Using Firebase Console (Recommended)**
1. Sign up a regular user account (as Guest or Host)
2. In Firebase Console, go to **Firestore Database**
3. Click on the `users` collection
4. Find the user document (document ID = Firebase Auth UID, or search by email)
5. Click on the document to edit it
6. Change the `role` field from `"guest"` or `"host"` to `"admin"`
7. Click "Update"
8. Sign out and sign back in to refresh auth state
9. User now has admin access - "Admin Panel" will appear in navigation

**Method 2: Using Admin Panel (If you already have admin)**
1. Sign in as existing admin
2. Go to Admin Dashboard → User Management
3. Find the user and change their role to "Admin"

**See [ADMIN_ACCESS.md](ADMIN_ACCESS.md) for detailed instructions**

### Set Service Fee

1. Sign in as admin
2. Go to Admin Dashboard > Service Fee
3. Set default service fee percentage
4. Save

### Test Firebase Connection

The app automatically tests Firebase connection on load. Check browser console for:
- ✅ Firebase App initialized
- ✅ Firebase Auth initialized
- ✅ Firestore connected
- ✅ Firebase Storage initialized
- ✅ Firebase Analytics initialized

---

## Troubleshooting

### Common Issues

#### Issue: `npm install` fails
**Solution**:
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node.js version (should be 16+)

#### Issue: Firebase connection errors
**Solution**:
- Verify Firebase config in `firebaseConfig.js`
- Check Firebase project is active
- Verify Authentication, Firestore, and Storage are enabled
- Check browser console for specific error messages

#### Issue: Port 3000 already in use
**Solution**:
- Change port in `vite.config.js`:
  ```javascript
  server: {
    port: 3001, // or any available port
  }
  ```

#### Issue: Build fails
**Solution**:
- Check for syntax errors in code
- Verify all imports are correct
- Check `package.json` for missing dependencies
- Review build error messages

#### Issue: Firestore permission denied
**Solution**:
- Verify Firestore rules are deployed
- Check user is authenticated
- Verify user has correct role
- Review security rules in `firestore.rules`

#### Issue: Images not uploading
**Solution**:
- Check Storage rules are deployed
- Verify file size (max 5MB recommended)
- Check file format (JPG, PNG, GIF)
- Verify user has upload permissions

### Getting Help

1. **Check Documentation**:
   - README.md
   - USER_MANUAL.md
   - TECHNICAL_DOCUMENTATION.md

2. **Review Error Messages**:
   - Browser console (F12)
   - Terminal output
   - Firebase Console logs

3. **Firebase Support**:
   - Firebase Documentation: https://firebase.google.com/docs
   - Firebase Support: https://firebase.google.com/support

---

## Development Workflow

### Daily Development

1. Start development server: `npm run dev`
2. Make code changes
3. Test in browser (auto-reload)
4. Check console for errors
5. Test features manually

### Before Committing

1. Run build: `npm run build`
2. Test production build: `npm run preview`
3. Check for linting errors
4. Test all major features
5. Update documentation if needed

### Before Deploying

1. Run full test suite
2. Build production version
3. Test production build locally
4. Review Firebase rules
5. Deploy to Firebase Hosting

---

## Project Structure Overview

```
solora-stayco/
├── src/              # Source code
├── public/           # Static assets
├── dist/             # Build output (generated)
├── node_modules/     # Dependencies (generated)
├── package.json      # Project configuration
├── vite.config.js    # Vite configuration
├── tailwind.config.js # TailwindCSS configuration
├── firebase.json     # Firebase configuration
└── README.md         # Project readme
```

---

## Next Steps

After setup:
1. ✅ Test Firebase connection
2. ✅ Create test accounts (guest, host, admin)
3. ✅ Create test listings
4. ✅ Test booking flow
5. ✅ Review security rules
6. ✅ Deploy to Firebase Hosting

---

**Last Updated**: December 2024
**Version**: 1.0

