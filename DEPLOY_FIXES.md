# Quick Fix Guide - Deploy Firestore Indexes and Storage Rules

## Issues Fixed

1. ✅ **Firestore Index Error**: Added composite index for `moods` collection
2. ✅ **CORS Error**: Updated Storage rules to allow authenticated uploads

## Deployment Steps

### Step 1: Deploy Firestore Indexes

The `moods` collection requires a composite index. Deploy it:

```bash
firebase deploy --only firestore:indexes
```

**Note**: After deploying, Firebase will automatically build the index. This may take a few minutes. You can check the status in Firebase Console → Firestore → Indexes.

### Step 2: Deploy Storage Rules

The Storage rules have been updated to allow authenticated users to upload listing photos. Deploy them:

```bash
firebase deploy --only storage:rules
```

### Step 3: Deploy Both at Once (Recommended)

```bash
firebase deploy --only firestore:indexes,storage:rules
```

## If You're Not Logged In

```bash
firebase login
firebase use solora-stayco
firebase deploy --only firestore:indexes,storage:rules
```

## Verify Deployment

1. **Firestore Indexes**:
   - Go to Firebase Console → Firestore → Indexes
   - Look for `moods` collection index with fields: `isActive`, `sortOrder`, `__name__`
   - Status should be "Enabled" (may take a few minutes after deployment)

2. **Storage Rules**:
   - Go to Firebase Console → Storage → Rules
   - Verify the rules allow authenticated users to write to `listings/{listingId}/{fileName}`

## After Deployment

1. Refresh your browser
2. Try uploading a photo again
3. The upload should work now!

## Troubleshooting

### If Index Still Building
- Wait 2-5 minutes after deployment
- Check Firebase Console → Firestore → Indexes for status
- The query will work automatically once the index is built

### If CORS Error Persists
- Make sure Storage rules are deployed: `firebase deploy --only storage:rules`
- Check Firebase Console → Storage → Rules to verify rules are active
- Clear browser cache and try again
- Make sure you're signed in as a host user

### If Upload Still Fails
- Check browser console for specific error messages
- Verify you're signed in (check AuthContext)
- Verify your user has `role: 'host'` in Firestore `users` collection

