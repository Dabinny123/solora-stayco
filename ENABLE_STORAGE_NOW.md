# 🚨 FIX CORS ERROR - Enable Firebase Storage

## The Error You're Seeing

```
Access to XMLHttpRequest blocked by CORS policy
```

**This happens because Firebase Storage is NOT enabled in your project.**

---

## ✅ SOLUTION (2 Minutes)

### Step 1: Open Firebase Console

**Click this link**: https://console.firebase.google.com/project/solora-stayco/storage

### Step 2: Enable Storage

You'll see a page that says:

```
Firebase Storage
Get started with Cloud Storage for Firebase
```

**Click the blue "Get Started" button**

### Step 3: Choose Production Mode

You'll see two options:
- ⚠️ Start in test mode
- ✅ **Start in production mode** ← **Choose this one**

**Click "Start in production mode"**

### Step 4: Select Location

Choose the **same location** as your Firestore database:
- If you don't know, check: https://console.firebase.google.com/project/solora-stayco/firestore/settings
- Common locations: `us-central`, `us-east1`, `asia-southeast1`

**Click "Done"**

### Step 5: Wait 30 Seconds

Storage will initialize. You'll see a message like "Storage is being set up..."

### Step 6: Deploy Storage Rules

**Open your terminal** and run:

```bash
firebase deploy --only storage:rules
```

You should see:
```
+  storage: deployed rules successfully
```

### Step 7: Test Upload

1. **Refresh your browser** (Ctrl+F5)
2. Go to: `http://localhost:3000/host/listings/create`
3. **Try uploading a photo**
4. ✅ **It should work now!**

---

## 🎯 What This Fixes

- ✅ Photo uploads will work
- ✅ CORS error will disappear
- ✅ All file uploads will work

---

## ❓ Still Not Working?

If you still see errors after enabling Storage:

1. **Make sure Storage is enabled**: Go back to https://console.firebase.google.com/project/solora-stayco/storage
   - You should see "Files" and "Rules" tabs (not "Get Started")

2. **Verify rules are deployed**: Run `firebase deploy --only storage:rules` again

3. **Check you're signed in**: Make sure you're logged into the app

4. **Clear browser cache**: Ctrl+Shift+Delete → Clear cache → Refresh

---

## 📝 Quick Checklist

- [ ] Opened Firebase Console Storage page
- [ ] Clicked "Get Started"
- [ ] Chose "Start in production mode"
- [ ] Selected location
- [ ] Clicked "Done"
- [ ] Waited 30 seconds
- [ ] Ran `firebase deploy --only storage:rules`
- [ ] Refreshed browser
- [ ] Tried uploading a photo

**Once all checked, photo uploads will work!** 🎉

