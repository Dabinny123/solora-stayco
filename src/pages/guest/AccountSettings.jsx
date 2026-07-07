// Account Settings Page for Solora StayCo
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateUser } from '../../services/usersService';
import { uploadProfilePhoto } from '../../firebase/storageService';
import { changePassword, resetPassword } from '../../auth/authService';
import { 
  getPayPalAccountStatus, 
  connectPayPalAccountSimple, 
  disconnectPayPalAccount 
} from '../../services/paypalAccountService';
import VerificationModal from '../../components/VerificationModal';

function AccountSettings() {
  const { currentUser, userData, isEmailVerified, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
    profilePhoto: null,
  });
  const [paypalStatus, setPaypalStatus] = useState({
    isConnected: false,
    email: null,
    merchantId: null,
    connectedAt: null,
  });
  const [paypalEmail, setPaypalEmail] = useState('');
  const [connectingPaypal, setConnectingPaypal] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailNotifications: true,
    bookingUpdates: true,
    promotionalEmails: false,
    smsNotifications: false,
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        displayName: userData.displayName || '',
        phoneNumber: userData.phoneNumber || '',
        profilePhoto: userData.profilePhoto || null,
      });
      // Load notification preferences
      if (userData.preferences?.notifications) {
        setNotificationPrefs({
          ...notificationPrefs,
          ...userData.preferences.notifications,
        });
      }
    }
  }, [userData]);

  useEffect(() => {
    async function loadPayPalStatus() {
      if (!currentUser) return;
      try {
        const status = await getPayPalAccountStatus(currentUser.uid);
        setPaypalStatus(status);
        if (status.email) {
          setPaypalEmail(status.email);
        }
      } catch (err) {
        console.error('Error loading PayPal status:', err);
      }
    }
    loadPayPalStatus();
  }, [currentUser, userData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
      return;
    }

    try {
      setLoading(true);
      const photoURL = await uploadProfilePhoto(file, currentUser.uid);
      handleChange('profilePhoto', photoURL);
      setMessage({ type: 'success', text: 'Profile photo uploaded successfully' });
    } catch (err) {
      console.error('Error uploading photo:', err);
      setMessage({ type: 'error', text: 'Failed to upload photo' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await updateUser(currentUser.uid, {
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        profilePhoto: formData.profilePhoto,
        preferences: {
          ...userData?.preferences,
          notifications: notificationPrefs,
        },
      });

      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setChangingPassword(true);
    setMessage({ type: '', text: '' });

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setChangingPassword(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters long' });
      setChangingPassword(false);
      return;
    }

    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setMessage({ type: 'success', text: 'Password changed successfully' });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordChange(false);
    } catch (err) {
      console.error('Error changing password:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to change password' });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSendPasswordReset = async () => {
    try {
      await resetPassword(currentUser.email);
      setMessage({ type: 'success', text: 'Password reset email sent! Check your inbox.' });
    } catch (err) {
      console.error('Error sending password reset:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to send password reset email' });
    }
  };

  const handleConnectPayPal = async () => {
    if (!paypalEmail.trim()) {
      setMessage({ type: 'error', text: 'Please enter your PayPal email address' });
      return;
    }

    setConnectingPaypal(true);
    setMessage({ type: '', text: '' });

    try {
      const paypalData = await connectPayPalAccountSimple(currentUser.uid, paypalEmail.trim());
      setPaypalStatus({
        isConnected: true,
        email: paypalData.email,
        merchantId: paypalData.merchantId,
        connectedAt: paypalData.connectedAt,
      });
      setMessage({ type: 'success', text: 'PayPal account connected successfully!' });
    } catch (err) {
      console.error('Error connecting PayPal:', err);
      setMessage({ type: 'error', text: 'Failed to connect PayPal account' });
    } finally {
      setConnectingPaypal(false);
    }
  };

  const handleDisconnectPayPal = async () => {
    if (!window.confirm('Are you sure you want to disconnect your PayPal account? You will not be able to create listings until you reconnect.')) {
      return;
    }

    setConnectingPaypal(true);
    setMessage({ type: '', text: '' });

    try {
      await disconnectPayPalAccount(currentUser.uid);
      setPaypalStatus({
        isConnected: false,
        email: null,
        merchantId: null,
        connectedAt: null,
      });
      setPaypalEmail('');
      setMessage({ type: 'success', text: 'PayPal account disconnected successfully' });
    } catch (err) {
      console.error('Error disconnecting PayPal:', err);
      setMessage({ type: 'error', text: 'Failed to disconnect PayPal account' });
    } finally {
      setConnectingPaypal(false);
    }
  };

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-display font-bold text-foreground mb-8">Account Settings</h1>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {message.text && (
            <div className={`px-4 py-3 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          {/* Profile Photo */}
          <div className="card">
            <h2 className="text-xl font-display font-semibold mb-4">Profile Photo</h2>
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {formData.profilePhoto ? (
                  <img src={formData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-12 h-12 text-muted-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              <div>
                <label className="btn btn-outline cursor-pointer">
                  {loading ? 'Uploading...' : 'Upload Photo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={loading}
                  />
                </label>
                <p className="text-sm text-muted-foreground mt-2">JPG, PNG or GIF. Max size 5MB</p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="card">
            <h2 className="text-xl font-display font-semibold mb-4">Personal Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="input bg-background"
                  value={currentUser?.email || ''}
                  disabled
                />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  Display Name *
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.displayName}
                  onChange={(e) => handleChange('displayName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="input"
                  value={formData.phoneNumber}
                  onChange={(e) => handleChange('phoneNumber', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="card">
            <h2 className="text-xl font-display font-semibold mb-4">Account Information</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role:</span>
                <span className="font-medium capitalize">{userData?.role || 'guest'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member since:</span>
                <span className="font-medium">
                  {userData?.createdAt 
                    ? new Date(userData.createdAt).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Email verified:</span>
                {isEmailVerified ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowVerifyModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/15 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Verify Now
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Verification prompt for unverified users */}
          {!isEmailVerified && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/15">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Email verification required</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    Verify your email to book stays and access the full Solora StayCo experience. We'll send a 6-digit code to your email.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowVerifyModal(true)}
                    className="btn btn-primary text-sm px-5 py-2 rounded-xl font-semibold"
                  >
                    Verify My Email
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Password Change */}
          <div className="card">
            <h2 className="text-xl font-display font-semibold mb-4">Password & Security</h2>
            {!showPasswordChange ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Change your password to keep your account secure. You'll need to enter your current password.
                </p>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowPasswordChange(true)}
                    className="btn btn-outline"
                  >
                    Change Password
                  </button>
                  <button
                    type="button"
                    onClick={handleSendPasswordReset}
                    className="btn btn-outline"
                  >
                    Send Reset Email
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">
                    Current Password *
                  </label>
                  <input
                    type="password"
                    className="input"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    required
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">
                    New Password *
                  </label>
                  <input
                    type="password"
                    className="input"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Must be at least 6 characters long</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    className="input"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    required
                    minLength={6}
                    placeholder="Re-enter new password"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="btn btn-primary"
                  >
                    {changingPassword ? 'Changing...' : 'Change Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordChange(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                    }}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Notification Preferences */}
          <div className="card">
            <h2 className="text-xl font-display font-semibold mb-4">Notification Preferences</h2>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Choose how you want to be notified about updates and activities.
              </p>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-background cursor-pointer">
                  <div>
                    <span className="font-medium text-foreground">Email Notifications</span>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.emailNotifications}
                    onChange={(e) => setNotificationPrefs({
                      ...notificationPrefs,
                      emailNotifications: e.target.checked
                    })}
                    className="w-5 h-5 text-primary rounded"
                  />
                </label>
                <label className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-background cursor-pointer">
                  <div>
                    <span className="font-medium text-foreground">Booking Updates</span>
                    <p className="text-sm text-muted-foreground">Get notified about booking confirmations and changes</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.bookingUpdates}
                    onChange={(e) => setNotificationPrefs({
                      ...notificationPrefs,
                      bookingUpdates: e.target.checked
                    })}
                    className="w-5 h-5 text-primary rounded"
                  />
                </label>
                <label className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-background cursor-pointer">
                  <div>
                    <span className="font-medium text-foreground">Promotional Emails</span>
                    <p className="text-sm text-muted-foreground">Receive special offers and promotions</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.promotionalEmails}
                    onChange={(e) => setNotificationPrefs({
                      ...notificationPrefs,
                      promotionalEmails: e.target.checked
                    })}
                    className="w-5 h-5 text-primary rounded"
                  />
                </label>
                <label className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-background cursor-pointer">
                  <div>
                    <span className="font-medium text-foreground">SMS Notifications</span>
                    <p className="text-sm text-muted-foreground">Receive important updates via text message</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.smsNotifications}
                    onChange={(e) => setNotificationPrefs({
                      ...notificationPrefs,
                      smsNotifications: e.target.checked
                    })}
                    className="w-5 h-5 text-primary rounded"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* PayPal Account Integration */}
          <div className="card">
            <h2 className="text-xl font-display font-semibold mb-4">PayPal Account Integration</h2>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {userData?.role === 'host' 
                  ? 'Connect your PayPal account to receive payments from guests. This is required to create and manage listings.'
                  : 'Connect your PayPal account for seamless payment processing when booking stays.'}
              </p>

              {paypalStatus.isConnected ? (
                <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold text-green-800">PayPal Account Connected</span>
                      </div>
                      <div className="text-sm text-foreground/80 space-y-1">
                        <p><span className="font-medium">Email:</span> {paypalStatus.email}</p>
                        {paypalStatus.connectedAt && (
                          <p className="text-xs text-muted-foreground">
                            Connected on {new Date(paypalStatus.connectedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDisconnectPayPal}
                      disabled={connectingPaypal}
                      className="btn btn-outline text-sm ml-4"
                    >
                      {connectingPaypal ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-border rounded-lg p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">
                      PayPal Email Address *
                    </label>
                    <input
                      type="email"
                      className="input"
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      placeholder="your-email@example.com"
                      disabled={connectingPaypal}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter the email address associated with your PayPal account
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleConnectPayPal}
                    disabled={connectingPaypal || !paypalEmail.trim()}
                    className="btn btn-primary"
                  >
                    {connectingPaypal ? 'Connecting...' : 'Connect PayPal Account'}
                  </button>
                </div>
              )}

              {/* Terms and Conditions */}
              <div className="border-t border-border pt-4 mt-4">
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium text-foreground/80 hover:text-foreground">
                    Terms and Conditions
                  </summary>
                  <div className="mt-2 text-xs text-muted-foreground space-y-2 pl-4 border-l-2 border-border">
                    <p>
                      <strong>1. Payment Processing:</strong> By connecting your PayPal account, you agree to use PayPal as the payment processor for all transactions on Solora StayCo.
                    </p>
                    <p>
                      <strong>2. Account Verification:</strong> Your PayPal account must be verified and in good standing. We reserve the right to verify your account status.
                    </p>
                    <p>
                      <strong>3. Transaction Fees:</strong> Standard PayPal transaction fees apply. Solora StayCo may charge additional service fees as outlined in our terms of service.
                    </p>
                    <p>
                      <strong>4. Payout Schedule:</strong> Payments from guests will be processed according to PayPal's standard payout schedule. Funds may be held for security purposes.
                    </p>
                    <p>
                      <strong>5. Account Security:</strong> You are responsible for maintaining the security of your PayPal account. Notify us immediately if you suspect unauthorized access.
                    </p>
                    <p>
                      <strong>6. Compliance:</strong> You must comply with all applicable laws and regulations regarding payment processing and tax reporting.
                    </p>
                    <p>
                      <strong>7. Disconnection:</strong> You may disconnect your PayPal account at any time, but active listings will be paused until a new payment method is connected.
                    </p>
                    <p>
                      <strong>8. Liability:</strong> Solora StayCo is not responsible for any issues arising from PayPal account problems, including but not limited to account holds, restrictions, or closures.
                    </p>
                  </div>
                </details>
              </div>
            </div>
          </div>

          {/* Coupon Management (Host Only) */}
          {userData?.role === 'host' && (
            <div className="card">
              <h2 className="text-xl font-display font-semibold mb-4">Coupon Management</h2>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Create and manage discount coupons for your listings. Guests can use these coupons during booking.
                </p>
                <div className="border border-border rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground/80 mb-1">
                        Coupon Code
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g., SUMMER2024"
                        maxLength="20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground/80 mb-1">
                        Discount (%)
                      </label>
                      <input
                        type="number"
                        className="input"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="10"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground/80 mb-1">
                        Valid From
                      </label>
                      <input
                        type="date"
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground/80 mb-1">
                        Valid Until
                      </label>
                      <input
                        type="date"
                        className="input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">
                      Minimum Nights
                    </label>
                    <input
                      type="number"
                      className="input"
                      min="1"
                      placeholder="Optional"
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline"
                  >
                    Create Coupon
                  </button>
                </div>
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-foreground/80 mb-3">Active Coupons</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">No coupons created yet.</p>
                    <p className="text-xs text-muted-foreground">
                      Create your first coupon to offer special discounts to guests.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary px-8 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Email Verification Modal */}
      <VerificationModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        onVerified={async () => {
          setShowVerifyModal(false);
          if (refreshUserData) await refreshUserData();
          setMessage({ type: 'success', text: 'Email verified successfully! You can now book stays.' });
        }}
      />
    </div>
  );
}

export default AccountSettings;
