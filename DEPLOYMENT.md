# Firebase Hosting Deployment Guide

## Prerequisites

1. Install Firebase CLI globally:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase in your project (if not already done):
```bash
firebase init
```

## Deployment Steps

### Step 1: Build the Project

Before deploying, build your project for production:

```bash
npm run build
```

This will create a `dist` folder with optimized production files.

### Step 2: Deploy to Firebase Hosting

Deploy your built files to Firebase Hosting:

```bash
firebase deploy --only hosting
```

Or use the npm script:

```bash
npm run deploy
```

### Step 3: Verify Deployment

After deployment, Firebase will provide you with a hosting URL:
- Production URL: `https://solora-stayco.web.app`
- Alternative URL: `https://solora-stayco.firebaseapp.com`

## Firebase Configuration

The `firebase.json` file is already configured with:
- **Public directory**: `dist` (Vite build output)
- **SPA routing**: All routes redirect to `index.html`
- **Firestore rules**: `firestore.rules`
- **Storage rules**: `storage.rules`

## Firestore Rules Deployment

To deploy Firestore security rules:

```bash
firebase deploy --only firestore:rules
```

## Storage Rules Deployment

To deploy Storage security rules:

```bash
firebase deploy --only storage
```

## Deploy Everything

To deploy hosting, Firestore rules, and Storage rules together:

```bash
firebase deploy
```

## Troubleshooting

### Build Errors
- Make sure all dependencies are installed: `npm install`
- Check for TypeScript/JavaScript errors in the console

### Deployment Errors
- Verify you're logged in: `firebase login`
- Check Firebase project: `firebase projects:list`
- Set correct project: `firebase use solora-stayco`

### Permission Errors
- Ensure your Firebase account has proper permissions
- Check Firestore and Storage rules for permission issues

## Environment Variables

If you need environment variables, create a `.env` file and configure them in your build process. Note: Firebase Hosting doesn't support server-side environment variables directly.

## Custom Domain

To set up a custom domain:
1. Go to Firebase Console > Hosting
2. Click "Add custom domain"
3. Follow the verification steps

