// Create Listing Page for Solora StayCo (supports create and edit modes)
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { createListing, updateListing, getListing } from '../../services/listingsService';
import { uploadListingPhoto } from '../../firebase/storageService';
import { uploadListingPhotoBase64 } from '../../services/imageService';
import { getAllMoods } from '../../services/moodsService';
import { createNotification } from '../../services/notificationsService';
import { hasPayPalConnected } from '../../services/paypalAccountService';
import PlacesAutocomplete from '../../components/PlacesAutocomplete';

function CreateListing({ editMode = false }) {
  const navigate = useNavigate();
  const { id: listingId } = useParams();
  const { currentUser, userData } = useAuth();
  const [loadingListing, setLoadingListing] = useState(editMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [availableMoods, setAvailableMoods] = useState([]);
  const [useBase64, setUseBase64] = useState(true); // Use base64 by default to avoid Storage setup
  const [paypalConnected, setPaypalConnected] = useState(false);
  const [checkingPaypal, setCheckingPaypal] = useState(true);
  const [showPaypalModal, setShowPaypalModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Home',
    type: '',
    location: {
      address: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
    },
    basePrice: '',
    cleaningFee: '',
    serviceFee: '',
    securityDeposit: '',
    currency: 'USD',
    maxGuests: '',
    bedrooms: '',
    beds: '',
    bathrooms: '',
    amenities: [],
    photos: [],
    status: 'draft',
    moodTags: [],
    ambienceTags: [],
    colorPalette: [],
    lighting: 'neutral',
    aestheticScore: 70,
    ambienceDescription: '',
    moodHighlights: '',
    discounts: {
      weekly: 0,
      monthly: 0,
      longTerm: 0,
    },
    promotions: [],
  });

  const [amenityInput, setAmenityInput] = useState('');
  const [ambienceInput, setAmbienceInput] = useState('');
  const [colorInput, setColorInput] = useState('');
  const [promoForm, setPromoForm] = useState({
    title: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    startDate: '',
    endDate: '',
    minNights: '',
  });

  useEffect(() => {
    async function loadMoods() {
      try {
        const moods = await getAllMoods();
        setAvailableMoods(moods);
      } catch (err) {
        console.error('Error loading moods:', err);
      }
    }
    loadMoods();
  }, []);

  // Load existing listing when editing
  useEffect(() => {
    if (!editMode || !listingId || !currentUser) return;
    async function loadListing() {
      try {
        setLoadingListing(true);
        const data = await getListing(listingId);
        if (!data) {
          setError('Listing not found');
          return;
        }
        if (data.hostId !== currentUser.uid && userData?.role !== 'admin') {
          setError('You do not have permission to edit this listing');
          return;
        }
        setFormData({
          title: data.title || '',
          description: data.description || '',
          category: data.category || 'Home',
          type: data.type || '',
          location: data.location || { address: '', city: '', state: '', country: '', zipCode: '' },
          basePrice: data.basePrice ?? '',
          cleaningFee: data.cleaningFee ?? '',
          serviceFee: data.serviceFee ?? '',
          securityDeposit: data.securityDeposit ?? '',
          currency: data.currency || 'USD',
          maxGuests: data.maxGuests ?? '',
          bedrooms: data.bedrooms ?? '',
          beds: data.beds ?? '',
          bathrooms: data.bathrooms ?? '',
          amenities: data.amenities || [],
          photos: Array.isArray(data.photos) ? data.photos : (data.featuredPhoto ? [data.featuredPhoto] : []),
          status: data.status || 'draft',
          moodTags: data.moodTags || [],
          ambienceTags: data.ambienceTags || [],
          colorPalette: data.colorPalette || [],
          lighting: data.lighting || 'neutral',
          aestheticScore: data.aestheticScore ?? 70,
          ambienceDescription: data.ambienceDescription || '',
          moodHighlights: data.moodHighlights || '',
          discounts: data.discounts || { weekly: 0, monthly: 0, longTerm: 0 },
          promotions: data.promotions || [],
        });
      } catch (err) {
        setError(err.message || 'Failed to load listing');
      } finally {
        setLoadingListing(false);
      }
    }
    loadListing();
  }, [editMode, listingId, currentUser?.uid, userData?.role]);

  useEffect(() => {
    async function checkPayPalConnection() {
      if (!currentUser) return;
      
      try {
        setCheckingPaypal(true);
        const connected = await hasPayPalConnected(currentUser.uid);
        setPaypalConnected(connected);
        
        // Show modal if not connected
        if (!connected) {
          setShowPaypalModal(true);
        }
      } catch (err) {
        console.error('Error checking PayPal connection:', err);
        setPaypalConnected(false);
        setShowPaypalModal(true);
      } finally {
        setCheckingPaypal(false);
      }
    }
    
    checkPayPalConnection();
  }, [currentUser]);

  const handleChange = (field, value) => {
    if (field.startsWith('location.')) {
      const locationField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleAddAmenity = () => {
    if (amenityInput.trim() && !formData.amenities.includes(amenityInput.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenityInput.trim()],
      }));
      setAmenityInput('');
    }
  };

  const handleRemoveAmenity = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity),
    }));
  };

  const handleAddAmbienceTag = () => {
    if (ambienceInput.trim() && !formData.ambienceTags.includes(ambienceInput.trim())) {
      setFormData(prev => ({
        ...prev,
        ambienceTags: [...prev.ambienceTags, ambienceInput.trim()],
      }));
      setAmbienceInput('');
    }
  };

  const handleRemoveAmbienceTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      ambienceTags: prev.ambienceTags.filter(t => t !== tag),
    }));
  };

  const handleAddColor = () => {
    if (colorInput.trim() && !formData.colorPalette.includes(colorInput.trim())) {
      setFormData(prev => ({
        ...prev,
        colorPalette: [...prev.colorPalette, colorInput.trim()],
      }));
      setColorInput('');
    }
  };

  const handleRemoveColor = (color) => {
    setFormData(prev => ({
      ...prev,
      colorPalette: prev.colorPalette.filter(c => c !== color),
    }));
  };

  const handleToggleMood = (moodId) => {
    setFormData(prev => {
      const exists = prev.moodTags.includes(moodId);
      return {
        ...prev,
        moodTags: exists
          ? prev.moodTags.filter(id => id !== moodId)
          : [...prev.moodTags, moodId],
      };
    });
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingPhotos(true);
    setError(null);
    
    try {
      // Validate file types and sizes
      // For base64, we need smaller files (500KB) due to Firestore 1MB limit
      const maxSize = useBase64 ? 500 * 1024 : 5 * 1024 * 1024; // 500KB for base64, 5MB for Storage
      const invalidFiles = files.filter(file => {
        if (!file.type.startsWith('image/')) {
          return true;
        }
        if (file.size > maxSize) {
          return true;
        }
        return false;
      });

      if (invalidFiles.length > 0) {
        const sizeLimit = useBase64 ? '500KB' : '5MB';
        throw new Error(`Please upload only image files under ${sizeLimit}`);
      }

      // Use base64 encoding instead of Firebase Storage
      const uploadPromises = files.map((file, index) => {
        if (useBase64) {
          return uploadListingPhotoBase64(file, 'temp', formData.photos.length + index);
        } else {
          return uploadListingPhoto(file, 'temp', formData.photos.length + index);
        }
      });
      
      const photoURLs = await Promise.all(uploadPromises);
      
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...photoURLs],
        featuredPhoto: prev.photos.length === 0 ? photoURLs[0] : prev.featuredPhoto,
      }));
    } catch (err) {
      console.error('Error uploading photos:', err);
      let errorMessage = 'Failed to upload photos. ';
      
      // Check for Storage not enabled error
      if (err.message && err.message.includes('STORAGE_NOT_ENABLED')) {
        errorMessage = (
          <div className="space-y-2">
            <p className="font-semibold text-red-600">⚠️ Firebase Storage is not enabled!</p>
            <p className="text-sm">To fix this:</p>
            <ol className="list-decimal list-inside text-sm space-y-1 ml-2">
              <li>Go to: <a href="https://console.firebase.google.com/project/solora-stayco/storage" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Firebase Console Storage</a></li>
              <li>Click <strong>"Get Started"</strong> button</li>
              <li>Choose <strong>"Start in production mode"</strong></li>
              <li>Select location (same as Firestore) and click <strong>"Done"</strong></li>
              <li>Then run: <code className="bg-muted px-1 rounded">firebase deploy --only storage:rules</code></li>
            </ol>
            <p className="text-sm mt-2">After enabling Storage, refresh this page and try again.</p>
          </div>
        );
      } else if (err.message && (err.message.includes('CORS') || err.message.includes('preflight') || err.message.includes('Failed to fetch'))) {
        errorMessage = (
          <div className="space-y-2">
            <p className="font-semibold text-red-600">⚠️ CORS Error - Storage Not Enabled</p>
            <p className="text-sm">Firebase Storage needs to be enabled. <a href="https://console.firebase.google.com/project/solora-stayco/storage" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Click here to enable it</a></p>
          </div>
        );
      } else if (err.code === 'storage/unauthorized') {
        errorMessage = 'Permission denied. Please make sure you are signed in.';
      } else if (err.code === 'storage/canceled') {
        errorMessage = 'Upload was canceled.';
      } else if (err.message) {
        errorMessage = err.message;
      } else {
        errorMessage += 'Please check your connection and try again.';
      }
      
      setError(errorMessage);
      
      // Reset file input
      e.target.value = '';
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleRemovePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
      featuredPhoto: index === 0 && prev.photos.length > 1 ? prev.photos[1] : prev.featuredPhoto,
    }));
  };

  const handleSetFeatured = (index) => {
    setFormData(prev => ({
      ...prev,
      featuredPhoto: prev.photos[index],
    }));
  };

  const handleSubmit = async (e, saveAsDraft = false) => {
    e.preventDefault();
    setError(null);
    setSuccess(null); // Clear any previous success message

    // Check PayPal connection for hosts (required for listing creation)
    if (!paypalConnected) {
      setError('PayPal account connection is required to create listings. Please connect your PayPal account in Settings.');
      setShowPaypalModal(true);
      return;
    }

    // Validation
    if (!saveAsDraft) {
      if (!formData.title || !formData.description || !formData.basePrice) {
        setError('Please fill in all required fields');
        return;
      }
      if (formData.photos.length === 0) {
        setError('Please upload at least one photo');
        return;
      }
    }

    setLoading(true);

    try {
      const listingData = {
        ...formData,
        basePrice: parseFloat(formData.basePrice) || 0,
        cleaningFee: parseFloat(formData.cleaningFee) || 0,
        serviceFee: parseFloat(formData.serviceFee) || 0,
        securityDeposit: parseFloat(formData.securityDeposit) || 0,
        maxGuests: parseInt(formData.maxGuests) || 1,
        bedrooms: parseInt(formData.bedrooms) || 0,
        beds: parseInt(formData.beds) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        aestheticScore: parseInt(formData.aestheticScore) || 0,
        moodTags: formData.moodTags || [],
        ambienceTags: formData.ambienceTags || [],
        colorPalette: formData.colorPalette || [],
        status: saveAsDraft ? 'draft' : 'active',
        publishedAt: saveAsDraft ? null : new Date().toISOString(),
      };

      if (editMode && listingId) {
        // Update existing listing
        await updateListing(listingId, listingData);
        setSuccess('✅ Listing updated successfully!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          setSuccess(null);
          navigate('/host/listings');
        }, 2000);
      } else {
        // Create new listing
        console.log('Creating listing...', listingData);
        const newId = await createListing(listingData, currentUser.uid);
        console.log('Listing created successfully! ID:', newId);
        try {
          await createNotification({
            userId: currentUser.uid,
            type: 'listing',
            title: saveAsDraft ? 'Draft Saved' : 'Listing Published',
            message: saveAsDraft 
              ? `Your listing "${formData.title}" has been saved as draft.`
              : `Your listing "${formData.title}" has been published and is now visible to guests!`,
            metadata: { listingId: newId, status: saveAsDraft ? 'draft' : 'active' },
          });
        } catch (notifErr) {
          console.error('Error creating notification:', notifErr);
        }
        const successMessage = saveAsDraft 
          ? '✅ Listing saved as draft successfully!'
          : '✅ Listing created and published successfully! It\'s now visible to guests.';
        setSuccess(successMessage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          setSuccess(null);
          navigate('/host/listings');
        }, 3000);
      }
    } catch (err) {
      console.error('Error creating listing:', err);
      setError(err.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  if (loadingListing) {
    return (
      <div className="container-custom py-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-display font-bold text-foreground mb-8">
        {editMode ? 'Edit Listing' : 'Create New Listing'}
      </h1>

      {/* PayPal Connection Modal */}
      {showPaypalModal && !paypalConnected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-display font-bold text-foreground">
                  PayPal Account Required
                </h2>
                <button
                  onClick={() => setShowPaypalModal(false)}
                  className="text-muted-foreground/70 hover:text-muted-foreground transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-yellow-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-yellow-800 mb-1">
                        PayPal Account Connection Required
                      </p>
                      <p className="text-sm text-yellow-700">
                        To create and manage listings, you must connect your PayPal account. This allows you to receive payments from guests.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="prose max-w-none">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Terms and Conditions</h3>
                  <div className="text-sm text-foreground/80 space-y-2 max-h-60 overflow-y-auto border border-border rounded p-4">
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
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-border">
                  <button
                    onClick={() => navigate('/settings')}
                    className="btn btn-primary flex-1"
                  >
                    Connect PayPal Account
                  </button>
                  <button
                    onClick={() => setShowPaypalModal(false)}
                    className="btn btn-outline"
                  >
                    I'll Do This Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Notification Banner */}
      {!paypalConnected && !showPaypalModal && !checkingPaypal && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mb-6 sticky top-4 z-40 shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-yellow-800 mb-1">
                  PayPal Account Required
                </p>
                <p className="text-sm text-yellow-700">
                  You must connect your PayPal account before creating listings. 
                  <button
                    onClick={() => setShowPaypalModal(true)}
                    className="underline font-semibold ml-1 hover:text-yellow-900"
                  >
                    Learn more
                  </button>
                  {' or '}
                  <button
                    onClick={() => navigate('/settings')}
                    className="underline font-semibold ml-1 hover:text-yellow-900"
                  >
                    connect now
                  </button>
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPaypalModal(true)}
              className="ml-4 text-yellow-600 hover:text-yellow-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {typeof error === 'string' ? error : error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border-2 border-green-400 text-green-900 px-6 py-4 rounded-lg flex items-center justify-between shadow-lg sticky top-4 z-50">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold text-lg">{success}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccess(null)}
              className="text-green-700 hover:text-green-900 ml-4"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {typeof error === 'string' ? error : error}
          </div>
        )}

        {/* Basic Information */}
        <div className="card">
          <h2 className="text-xl font-display font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                Title *
              </label>
              <input
                type="text"
                className="input"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                Description *
              </label>
              <textarea
                className="input"
                rows="6"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  Category *
                </label>
                <select
                  className="input"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  required
                >
                  <option value="Home">Home</option>
                  <option value="Experience">Experience</option>
                  <option value="Service">Service</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  Type
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., Apartment, Villa, Workshop"
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="card">
          <h2 className="text-xl font-display font-semibold mb-4">Location</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                Address *
              </label>
              <PlacesAutocomplete
                value={formData.location.address}
                onChange={(value) => handleChange('location.address', value)}
                onPlaceSelect={(place) => {
                  // Auto-fill location fields from selected place
                  if (place.addressComponents) {
                    setFormData(prev => ({
                      ...prev,
                      location: {
                        address: place.formattedAddress,
                        city: place.addressComponents.city || prev.location.city,
                        state: place.addressComponents.state || prev.location.state,
                        country: place.addressComponents.country || prev.location.country,
                        zipCode: place.addressComponents.zipCode || prev.location.zipCode,
                        coordinates: place.coordinates,
                      },
                    }));
                  }
                }}
                placeholder="Start typing an address..."
                types={['address']}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Start typing to see address suggestions. Selecting an address will auto-fill city, state, country, and coordinates.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  City
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.location.city}
                  onChange={(e) => handleChange('location.city', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  State
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.location.state}
                  onChange={(e) => handleChange('location.state', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.location.country}
                  onChange={(e) => handleChange('location.country', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  ZIP Code
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.location.zipCode}
                  onChange={(e) => handleChange('location.zipCode', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="card">
          <h2 className="text-xl font-display font-semibold mb-4">Pricing</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                Base Price (per night) *
              </label>
              <input
                type="number"
                className="input"
                min="0"
                step="0.01"
                value={formData.basePrice}
                onChange={(e) => handleChange('basePrice', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                Currency
              </label>
              <select
                className="input"
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                Cleaning Fee
              </label>
              <input
                type="number"
                className="input"
                min="0"
                step="0.01"
                value={formData.cleaningFee}
                onChange={(e) => handleChange('cleaningFee', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                Security Deposit
              </label>
              <input
                type="number"
                className="input"
                min="0"
                step="0.01"
                value={formData.securityDeposit}
                onChange={(e) => handleChange('securityDeposit', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Discounts */}
        <div className="card">
          <h2 className="text-xl font-display font-semibold mb-4">Discounts</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                Weekly Discount (%)
              </label>
              <input
                type="number"
                className="input"
                min="0"
                max="100"
                step="0.1"
                value={formData.discounts.weekly}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  discounts: { ...prev.discounts, weekly: parseFloat(e.target.value) || 0 }
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                Monthly Discount (%)
              </label>
              <input
                type="number"
                className="input"
                min="0"
                max="100"
                step="0.1"
                value={formData.discounts.monthly}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  discounts: { ...prev.discounts, monthly: parseFloat(e.target.value) || 0 }
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                Long-term Discount (%)
              </label>
              <input
                type="number"
                className="input"
                min="0"
                max="100"
                step="0.1"
                value={formData.discounts.longTerm}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  discounts: { ...prev.discounts, longTerm: parseFloat(e.target.value) || 0 }
                }))}
              />
            </div>
          </div>
        </div>

        {/* Promotions */}
        <div className="card">
          <h2 className="text-xl font-display font-semibold mb-4">Promotions</h2>
          <div className="space-y-4">
            <div className="border border-border rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">
                    Promotion Title
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={promoForm.title}
                    onChange={(e) => setPromoForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Summer Special"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={promoForm.description}
                    onChange={(e) => setPromoForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Promotion description"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">
                    Discount Type
                  </label>
                  <select
                    className="input"
                    value={promoForm.discountType}
                    onChange={(e) => setPromoForm(prev => ({ ...prev, discountType: e.target.value }))}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    className="input"
                    min="0"
                    step="0.01"
                    value={promoForm.discountValue}
                    onChange={(e) => setPromoForm(prev => ({ ...prev, discountValue: e.target.value }))}
                    placeholder={promoForm.discountType === 'percentage' ? '%' : 'Amount'}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={promoForm.startDate}
                    onChange={(e) => setPromoForm(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={promoForm.endDate}
                    onChange={(e) => setPromoForm(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">
                    Min Nights
                  </label>
                  <input
                    type="number"
                    className="input"
                    min="1"
                    value={promoForm.minNights}
                    onChange={(e) => setPromoForm(prev => ({ ...prev, minNights: e.target.value }))}
                    placeholder="Minimum nights"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (promoForm.title && promoForm.discountValue) {
                    const newPromo = {
                      id: Date.now().toString(),
                      ...promoForm,
                      discountValue: parseFloat(promoForm.discountValue) || 0,
                      minNights: parseInt(promoForm.minNights) || 0,
                      isActive: true,
                    };
                    setFormData(prev => ({
                      ...prev,
                      promotions: [...prev.promotions, newPromo]
                    }));
                    setPromoForm({
                      title: '',
                      description: '',
                      discountType: 'percentage',
                      discountValue: '',
                      startDate: '',
                      endDate: '',
                      minNights: '',
                    });
                  }
                }}
                className="btn btn-outline"
              >
                Add Promotion
              </button>
            </div>
            {formData.promotions.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground/80">Active Promotions:</h3>
                {formData.promotions.map((promo) => (
                  <div key={promo.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <div>
                      <p className="font-semibold">{promo.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {promo.discountValue}{promo.discountType === 'percentage' ? '%' : ` ${formData.currency}`} off
                        {promo.minNights > 0 && ` • Min ${promo.minNights} nights`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {promo.startDate && new Date(promo.startDate).toLocaleDateString()} - {promo.endDate && new Date(promo.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        promotions: prev.promotions.filter(p => p.id !== promo.id)
                      }))}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Capacity */}
        <div className="card">
          <h2 className="text-xl font-display font-semibold mb-4">Capacity</h2>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                Max Guests
              </label>
              <input
                type="number"
                className="input"
                min="1"
                value={formData.maxGuests}
                onChange={(e) => handleChange('maxGuests', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                Bedrooms
              </label>
              <input
                type="number"
                className="input"
                min="0"
                value={formData.bedrooms}
                onChange={(e) => handleChange('bedrooms', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                Beds
              </label>
              <input
                type="number"
                className="input"
                min="0"
                value={formData.beds}
                onChange={(e) => handleChange('beds', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                Bathrooms
              </label>
              <input
                type="number"
                className="input"
                min="0"
                step="0.5"
                value={formData.bathrooms}
                onChange={(e) => handleChange('bathrooms', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="card">
          <h2 className="text-xl font-display font-semibold mb-4">Amenities</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              className="input flex-1"
              placeholder="Add amenity (e.g., WiFi, Pool, Parking)"
              value={amenityInput}
              onChange={(e) => setAmenityInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAmenity())}
            />
            <button
              type="button"
              onClick={handleAddAmenity}
              className="btn btn-outline"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.amenities.map((amenity, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
              >
                {amenity}
                <button
                  type="button"
                  onClick={() => handleRemoveAmenity(amenity)}
                  className="ml-2 text-primary hover:text-primary"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Mood & Ambience */}
        <div className="card">
          <h2 className="text-xl font-display font-semibold mb-4">Mood & Ambience</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Mood Categories
              </label>
              {availableMoods.length === 0 ? (
                <p className="text-sm text-muted-foreground">No moods available yet. Admins can add moods in the admin panel.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableMoods.map((mood) => (
                    <label key={mood.id} className="flex items-start gap-2 p-3 border border-border rounded-lg cursor-pointer hover:border-primary-300">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={formData.moodTags.includes(mood.id)}
                        onChange={() => handleToggleMood(mood.id)}
                      />
                      <div>
                        <p className="font-semibold text-foreground">{mood.name}</p>
                        <p className="text-sm text-muted-foreground">{mood.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  Ambience Tags
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    className="input flex-1"
                    placeholder="e.g., warm lighting, textured walls"
                    value={ambienceInput}
                    onChange={(e) => setAmbienceInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAmbienceTag())}
                  />
                  <button type="button" onClick={handleAddAmbienceTag} className="btn btn-outline">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.ambienceTags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full bg-secondary-50 text-secondary-700 text-sm">
                      {tag}
                      <button type="button" onClick={() => handleRemoveAmbienceTag(tag)} className="ml-2 text-secondary-500 hover:text-secondary-700">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  Color Palette
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    className="input flex-1"
                    placeholder="e.g., earthy, pastel, monochrome"
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddColor())}
                  />
                  <button type="button" onClick={handleAddColor} className="btn btn-outline">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.colorPalette.map((color, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                      {color}
                      <button type="button" onClick={() => handleRemoveColor(color)} className="ml-2 text-primary hover:text-primary">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  Lighting Style
                </label>
                <select
                  className="input"
                  value={formData.lighting}
                  onChange={(e) => handleChange('lighting', e.target.value)}
                >
                  <option value="warm">Warm & Cozy</option>
                  <option value="cool">Cool & Minimal</option>
                  <option value="natural">Natural Light</option>
                  <option value="neutral">Neutral</option>
                  <option value="dramatic">Dramatic Glow</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  Aesthetic Score ({formData.aestheticScore})
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.aestheticScore}
                  onChange={(e) => handleChange('aestheticScore', e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">Higher scores indicate stronger mood identity.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                Ambience Description
              </label>
              <textarea
                className="input"
                rows="3"
                placeholder="Describe the feeling guests will experience (lighting, textures, scent, etc.)"
                value={formData.ambienceDescription}
                onChange={(e) => handleChange('ambienceDescription', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                Mood Highlights (for marketing copy)
              </label>
              <textarea
                className="input"
                rows="2"
                placeholder="E.g., 'Sunset-lit archways with earthy textures and artisan ceramics'"
                value={formData.moodHighlights}
                onChange={(e) => handleChange('moodHighlights', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="card">
          <h2 className="text-xl font-display font-semibold mb-4">Photos</h2>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <p className="font-semibold mb-1">📸 Using Base64 Storage</p>
            <p>Images are stored directly in the database (no Firebase Storage needed). Images are automatically compressed to optimize size.</p>
            <p className="mt-1 text-xs">Note: Maximum 500KB per image. For larger images, consider enabling Firebase Storage.</p>
          </div>
          <div className="mb-4">
            <label className="btn btn-outline cursor-pointer">
              {uploadingPhotos ? 'Uploading...' : 'Upload Photos'}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploadingPhotos}
              />
            </label>
          </div>
          {formData.photos.length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              {formData.photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  {formData.featuredPhoto === photo && (
                    <span className="absolute top-2 left-2 px-2 py-1 bg-primary text-white text-xs rounded">
                      Featured
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetFeatured(index)}
                      className="opacity-0 group-hover:opacity-100 text-white text-sm px-2 py-1 bg-primary rounded"
                    >
                      Set Featured
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="opacity-0 group-hover:opacity-100 text-white text-sm px-2 py-1 bg-red-600 rounded"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary px-8 disabled:opacity-50"
          >
            {loading ? 'Publishing...' : 'Publish Listing'}
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading}
            className="btn btn-outline px-8 disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => navigate('/host/dashboard')}
            className="btn btn-outline px-8"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateListing;

