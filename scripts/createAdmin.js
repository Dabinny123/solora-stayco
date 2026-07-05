// Script to create admin user
// Run this in browser console after signing in

// Method 1: Update existing user to admin
async function makeCurrentUserAdmin() {
  const { updateDocument } = await import('../src/firebase/firestoreService.js');
  const { getCurrentUser } = await import('../src/auth/authService.js');
  
  const user = getCurrentUser();
  if (!user) {
    console.error('No user signed in');
    return;
  }
  
  try {
    await updateDocument('users', user.uid, { role: 'admin' });
    console.log('✅ User role updated to admin!');
    console.log('Please refresh the page to see admin panel.');
  } catch (error) {
    console.error('Error updating role:', error);
  }
}

// Method 2: Update user by email
async function makeUserAdminByEmail(email) {
  const { getDocuments, updateDocument } = await import('../src/firebase/firestoreService.js');
  
  try {
    const users = await getDocuments('users', [
      { field: 'email', operator: '==', value: email }
    ]);
    
    if (users.length === 0) {
      console.error('User not found');
      return;
    }
    
    const user = users[0];
    await updateDocument('users', user.uid, { role: 'admin' });
    console.log(`✅ User ${email} role updated to admin!`);
  } catch (error) {
    console.error('Error updating role:', error);
  }
}

// Export for use
if (typeof window !== 'undefined') {
  window.makeCurrentUserAdmin = makeCurrentUserAdmin;
  window.makeUserAdminByEmail = makeUserAdminByEmail;
  console.log('Admin creation functions loaded!');
  console.log('Usage:');
  console.log('  - makeCurrentUserAdmin() - Make current user admin');
  console.log('  - makeUserAdminByEmail("email@example.com") - Make user admin by email');
}

