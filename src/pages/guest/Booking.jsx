// Booking Page for Solora StayCo
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getListing } from '../../services/listingsService';
import { createBooking } from '../../services/bookingsService';
import { createPayment, completePayment, getPaymentByPayPalOrderId, getPaymentByTransactionId } from '../../services/paymentsService';
import { getWalletBalance, payWithWallet } from '../../services/walletService';
import { updateUserMoodPreferences } from '../../services/usersService';
import { createNotification } from '../../services/notificationsService';
import { createMessage } from '../../services/messagesService';
import { createPayPalPayment, getPayPalConfig } from '../../services/paypalService';
import { getDocuments } from '../../firebase/firestoreService';
import { createTransactionLog, TRANSACTION_EVENTS } from '../../services/transactionLogService';
import VerificationModal from '../../components/VerificationModal';

function Booking() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, userData, isEmailVerified } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    guests: parseInt(searchParams.get('guests')) || 1,
    guestName: userData?.displayName || '',
    guestEmail: currentUser?.email || '',
    guestPhone: '',
    specialRequests: '',
    paymentMethod: 'e-wallet', // 'e-wallet', 'paypal', 'bank', or 'card'
    paymentType: 'full', // 'down', 'full', 'custom'
    customPaymentAmount: 0,
  });
  const [walletBalance, setWalletBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [selectedMoodId, setSelectedMoodId] = useState(null);
  const [paypalButtons, setPaypalButtons] = useState(null);
  const [showPayPalButtons, setShowPayPalButtons] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    routingNumber: '',
  });
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const safeCreateTransactionLog = async (logData) => {
    try {
      await createTransactionLog(logData);
    } catch (logError) {
      console.error('Error writing transaction log:', logError);
    }
  };

  const safeCreateNotifications = async (notifications) => {
    try {
      await Promise.all(notifications.map((notification) => createNotification(notification)));
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
    }
  };

  const formatBookingMessageDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const safeCreateBookingMessage = async (bookingId, pricing, paymentMethod) => {
    try {
      await createMessage({
        senderId: currentUser.uid,
        receiverId: listing.hostId,
        bookingId,
        listingId: listing.id,
        type: 'booking',
        content: `${formData.guestName} booked ${listing.title} from ${formatBookingMessageDate(formData.checkIn)} to ${formatBookingMessageDate(formData.checkOut)} for ${pricing.nights} night${pricing.nights === 1 ? '' : 's'} using ${paymentMethod}.`,
      });
    } catch (messageError) {
      console.error('Error creating booking message:', messageError);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      navigate('/signin');
      return;
    }
    loadListing();
    loadWalletBalance();
    const storedMood = localStorage.getItem('solora:selectedMood');
    if (storedMood) {
      setSelectedMoodId(storedMood);
    }
  }, [id, currentUser]);

  // Initialize PayPal buttons when PayPal is selected and form is ready
  useEffect(() => {
    if (
      formData.paymentMethod === 'paypal' && 
      listing && 
      formData.checkIn && 
      formData.checkOut && 
      formData.guestName && 
      formData.guestEmail
    ) {
      // Always show PayPal buttons when form is ready
      if (!showPayPalButtons) {
        setShowPayPalButtons(true);
      }
      // Initialize PayPal if not already done
      if (!paypalButtons) {
        initializePayPal();
      }
    } else if (formData.paymentMethod !== 'paypal') {
      // Hide PayPal buttons when switching away from PayPal
      setShowPayPalButtons(false);
      setPaypalButtons(null);
    }
  }, [formData.paymentMethod, listing, formData.checkIn, formData.checkOut, formData.guestName, formData.guestEmail]);

  // Render PayPal buttons when ready
  useEffect(() => {
    if (paypalButtons && showPayPalButtons && formData.paymentMethod === 'paypal') {
      // Small delay to ensure container is in DOM
      const timer = setTimeout(() => {
        const container = document.getElementById('paypal-button-container');
        if (container) {
          // Clear any existing buttons
          container.innerHTML = '';
          // Render PayPal buttons
          paypalButtons.render('#paypal-button-container').catch((err) => {
            console.error('Error rendering PayPal buttons:', err);
            setError('Failed to load PayPal buttons. Please try another payment method.');
          });
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
    
    // Cleanup: clear container when switching payment methods
    if (formData.paymentMethod !== 'paypal') {
      const container = document.getElementById('paypal-button-container');
      if (container) {
        container.innerHTML = '';
      }
    }
  }, [paypalButtons, showPayPalButtons, formData.paymentMethod]);

  const getPaymentAmount = () => {
    const pricing = calculatePricingSync();
    const downPaymentPercentage = 30; // Default 30% - can be configured
    const downPaymentAmount = (pricing.total * downPaymentPercentage) / 100;
    
    if (formData.paymentType === 'down') {
      return downPaymentAmount;
    } else if (formData.paymentType === 'custom') {
      // Ensure custom amount is at least down payment
      return Math.max(formData.customPaymentAmount || 0, downPaymentAmount);
    } else {
      return pricing.total; // Full payment
    }
  };

  const initializePayPal = async () => {
    try {
      const pricing = calculatePricingSync();
      if (pricing.total <= 0) {
        setError('Please select check-in and check-out dates first');
        return;
      }

      // Validate form before showing PayPal
      if (!formData.checkIn || !formData.checkOut || !formData.guestName || !formData.guestEmail) {
        setError('Please fill in all required fields before proceeding with PayPal');
        return;
      }

      const paymentAmount = getPaymentAmount();
      const downPaymentPercentage = 30;
      const downPaymentAmount = (pricing.total * downPaymentPercentage) / 100;

      // Validate payment amount
      if (formData.paymentType === 'custom' && paymentAmount < downPaymentAmount) {
        setError(`Custom payment amount must be at least ${formatPrice(downPaymentAmount)} (${downPaymentPercentage}% down payment)`);
        return;
      }

      const buttons = await createPayPalPayment(
        {
          amount: paymentAmount.toFixed(2),
          currency: listing.currency || 'USD',
          description: formData.paymentType === 'full' 
            ? `Full payment for ${listing.title}`
            : formData.paymentType === 'down'
            ? `Down payment (${downPaymentPercentage}%) for ${listing.title}`
            : `Partial payment for ${listing.title}`,
          bookingId: '', // Will be set after booking is created
          paymentType: formData.paymentType,
          totalAmount: pricing.total,
          hostEarnings: pricing.hostEarnings,
          adminCommission: pricing.adminCommission,
        },
        handlePayPalSuccess,
        handlePayPalError
      );

      setPaypalButtons(buttons);
    } catch (error) {
      console.error('Error initializing PayPal:', error);
      setError('Failed to load PayPal. Please try another payment method.');
      setShowPayPalButtons(false);
    }
  };

  const handlePayPalSuccess = async (paymentResult) => {
    try {
      setSubmitting(true);
      setError(null);

      // Validate form data
      if (!formData.checkIn || !formData.checkOut || !formData.guestName || !formData.guestEmail) {
        setError('Please fill in all required fields');
        setSubmitting(false);
        return;
      }

      // Create booking first
      const pricing = await calculatePricing();
      const existingPayment =
        (await getPaymentByTransactionId(paymentResult.transactionId)) ||
        (await getPaymentByPayPalOrderId(paymentResult.orderId));

      if (existingPayment?.bookingId) {
        navigate(`/booking/${existingPayment.bookingId}/confirmation`);
        return;
      }

      const bookingData = {
        listingId: id,
        guestId: currentUser.uid,
        hostId: listing.hostId,
        checkIn: new Date(formData.checkIn).toISOString(),
        checkOut: new Date(formData.checkOut).toISOString(),
        numberOfNights: pricing.nights,
        numberOfGuests: formData.guests,
        guestDetails: {
          name: formData.guestName,
          email: formData.guestEmail,
          phone: formData.guestPhone,
          specialRequests: formData.specialRequests,
        },
        basePrice: listing.basePrice,
        cleaningFee: pricing.cleaningFee,
        serviceFee: pricing.serviceFee,
        totalAmount: pricing.total,
        currency: listing.currency || 'USD',
        status: 'pending',
        paymentStatus: 'paid',
        paymentMethod: 'paypal',
        selectedMoodId,
        recommendationSource: selectedMoodId ? 'mood' : 'search',
      };

      const bookingId = await createBooking(bookingData);
      await safeCreateTransactionLog({
        type: TRANSACTION_EVENTS.BOOKING_CREATED,
        userId: currentUser.uid,
        actorId: currentUser.uid,
        bookingId,
        amount: pricing.total,
        currency: listing.currency || 'USD',
        paymentMethod: 'paypal',
        status: 'pending',
        description: `Booking created after PayPal capture for ${listing.title}`,
      });

      // Calculate payment amount and remaining balance
      const paymentAmount = parseFloat(paymentResult.amount);
      const remainingBalance = pricing.total - paymentAmount;
      const isFullPayment = paymentAmount >= pricing.total;
      
      // Calculate proportional split for partial payments
      const paymentRatio = paymentAmount / pricing.total;
      const proportionalAdminCommission = pricing.adminCommission * paymentRatio;
      const proportionalHostEarnings = pricing.hostEarnings * paymentRatio;

      // Create and complete payment with commission split
      const paymentData = {
        userId: currentUser.uid,
        bookingId: bookingId,
        hostId: listing.hostId,
        amount: paymentAmount,
        currency: listing.currency || 'USD',
        fees: {
          serviceFee: pricing.serviceFee * paymentRatio,
          processingFee: 0,
        },
        // Commission split (proportional for partial payments)
        commission: {
          adminCommission: proportionalAdminCommission,
          hostEarnings: proportionalHostEarnings,
          totalAmount: pricing.total,
          paymentAmount: paymentAmount,
          remainingBalance: remainingBalance,
        },
        totalAmount: pricing.total,
        remainingBalance: remainingBalance,
        paymentType: formData.paymentType,
        isFullPayment: isFullPayment,
        method: 'paypal',
        status: isFullPayment ? 'paid' : 'partial',
        transactionId: paymentResult.transactionId,
        paypalOrderId: paymentResult.orderId,
      };

      const paymentId = await createPayment(paymentData);
      await completePayment(paymentId, paymentResult.transactionId);
      await safeCreateTransactionLog({
        type: TRANSACTION_EVENTS.PAYMENT_COMPLETED,
        userId: currentUser.uid,
        actorId: currentUser.uid,
        bookingId,
        paymentId,
        externalTransactionId: paymentResult.transactionId,
        amount: paymentAmount,
        currency: listing.currency || 'USD',
        paymentMethod: 'paypal',
        status: isFullPayment ? 'paid' : 'partial',
        description: `PayPal payment completed for booking ${bookingId}`,
        metadata: {
          paypalOrderId: paymentResult.orderId,
          remainingBalance,
        },
      });

      // Update booking with payment ID and status
      // IMPORTANT: Set status to 'confirmed' after successful payment
      const { updateBooking } = await import('../../services/bookingsService');
      await updateBooking(bookingId, {
        paymentId: paymentId,
        paidAt: new Date().toISOString(),
        paymentStatus: isFullPayment ? 'paid' : 'partial',
        paymentMethod: 'paypal',
        paymentTransactionId: paymentResult.transactionId,
        paypalOrderId: paymentResult.orderId,
        paymentCompletedAt: new Date().toISOString(),
        remainingBalance: remainingBalance,
        status: 'confirmed', // Confirm booking after successful payment
        confirmedAt: new Date().toISOString(),
      });

      // Credit host wallet with earnings (instead of auto-payout)
      if (isFullPayment && proportionalHostEarnings > 0) {
        try {
          const { creditHostWallet } = await import('../../services/walletService');
          
          console.log('💰 Crediting host wallet:', {
            hostId: listing.hostId,
            amount: proportionalHostEarnings,
            bookingId,
            paymentId,
          });
          
          await creditHostWallet(
            listing.hostId,
            proportionalHostEarnings,
            bookingId,
            paymentId
          );
          await safeCreateTransactionLog({
            type: TRANSACTION_EVENTS.WALLET_CREDITED,
            userId: listing.hostId,
            actorId: currentUser.uid,
            bookingId,
            paymentId,
            amount: proportionalHostEarnings,
            currency: listing.currency || 'USD',
            paymentMethod: 'wallet',
            status: 'completed',
            description: `Host wallet credited from booking ${bookingId}`,
          });
          
          console.log(`✅ Host wallet credited: $${proportionalHostEarnings} added to host ${listing.hostId}`);
          
          // Notify host of wallet credit
          await safeCreateNotifications([{
            userId: listing.hostId,
            type: 'payment',
            title: 'Earnings added to wallet',
            message: `$${proportionalHostEarnings.toFixed(2)} has been added to your wallet from booking ${bookingId}`,
            metadata: { bookingId, paymentId, amount: proportionalHostEarnings },
          }]);
        } catch (error) {
          console.error('❌ Error crediting host wallet:', error);
          // Don't fail the booking if wallet credit fails - admin can fix manually
          // Log error for admin review
          try {
            const { createDocument } = await import('../../firebase/firestoreService');
            await createDocument('wallet_errors', {
              paymentId,
              hostId: listing.hostId,
              amount: proportionalHostEarnings,
              bookingId,
              status: 'failed',
              error: error.message,
              createdAt: new Date().toISOString(),
            });
          } catch (walletErrorLogError) {
            console.error('Error writing wallet error log:', walletErrorLogError);
          }
          await safeCreateTransactionLog({
            type: TRANSACTION_EVENTS.WALLET_CREDITED,
            userId: listing.hostId,
            actorId: currentUser.uid,
            bookingId,
            paymentId,
            amount: proportionalHostEarnings,
            currency: listing.currency || 'USD',
            paymentMethod: 'wallet',
            status: 'failed',
            description: `Host wallet credit failed for booking ${bookingId}`,
            metadata: { error: error.message },
          });
        }
      }

      // Create notifications
      await safeCreateNotifications([
        {
          userId: listing.hostId,
          type: 'booking',
          title: 'New confirmed booking',
          message: `${formData.guestName} booked ${pricing.nights} nights at ${listing.title}`,
          metadata: { bookingId, listingId: listing.id },
        },
        {
          userId: currentUser.uid,
          type: 'booking',
          title: 'Booking confirmed',
          message: `Your booking at ${listing.title} has been confirmed!`,
          metadata: { bookingId },
        },
      ]);
      await safeCreateBookingMessage(bookingId, pricing, 'PayPal');

      if (selectedMoodId) {
        try {
          await updateUserMoodPreferences(currentUser.uid, selectedMoodId);
        } catch (preferenceError) {
          console.error('Error updating mood preferences:', preferenceError);
        }
      }

      // Navigate to confirmation
      navigate(`/booking/${bookingId}/confirmation`);
    } catch (error) {
      console.error('Error processing PayPal payment:', error);
      try {
        await safeCreateTransactionLog({
          type: TRANSACTION_EVENTS.PAYMENT_FAILED,
          userId: currentUser?.uid || null,
          actorId: currentUser?.uid || null,
          externalTransactionId: paymentResult?.transactionId || null,
          amount: paymentResult?.amount ? parseFloat(paymentResult.amount) : 0,
          currency: paymentResult?.currency || listing?.currency || 'USD',
          paymentMethod: 'paypal',
          status: 'failed',
          description: 'PayPal payment captured but booking workflow failed',
          metadata: { error: error.message, paypalOrderId: paymentResult?.orderId },
        });
      } catch (logError) {
        console.error('Error writing PayPal failure log:', logError);
      }
      setError('Payment successful but booking creation failed. Please contact support.');
      setSubmitting(false);
    }
  };

  const handlePayPalError = (error) => {
    console.error('PayPal payment error:', error);
    setError(error.message || 'PayPal payment failed. Please try again.');
    setSubmitting(false);
  };

  const loadWalletBalance = async () => {
    if (!currentUser) return;
    try {
      setLoadingBalance(true);
      const balance = await getWalletBalance(currentUser.uid);
      setWalletBalance(balance);
    } catch (err) {
      console.error('Error loading wallet balance:', err);
    } finally {
      setLoadingBalance(false);
    }
  };

  const loadListing = async () => {
    try {
      setLoading(true);
      const listingData = await getListing(id);
      if (!listingData) {
        setError('Listing not found');
        return;
      }
      setListing(listingData);
      
      // Set max guests if provided
      if (listingData.maxGuests && formData.guests > listingData.maxGuests) {
        setFormData(prev => ({ ...prev, guests: listingData.maxGuests }));
      }
    } catch (err) {
      console.error('Error loading listing:', err);
      setError('Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculatePricing = async () => {
    if (!listing || !formData.checkIn || !formData.checkOut) {
      return {
        nights: 0,
        basePrice: 0,
        cleaningFee: listing?.cleaningFee || 0,
        serviceFee: 0,
        adminCommission: 0,
        hostEarnings: 0,
        total: 0,
      };
    }

    const checkInDate = new Date(formData.checkIn);
    const checkOutDate = new Date(formData.checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      return {
        nights: 0,
        basePrice: 0,
        cleaningFee: listing?.cleaningFee || 0,
        serviceFee: 0,
        adminCommission: 0,
        hostEarnings: 0,
        total: 0,
      };
    }

    const basePrice = listing.basePrice * nights;
    const cleaningFee = listing.cleaningFee || 0;
    
    // Get service fee percentage from settings (default 10%)
    let serviceFeePercentage = 10;
    try {
      const settings = await getDocuments('settings', [], 'createdAt', 'desc', 1);
      if (settings.length > 0 && settings[0].serviceFee) {
        serviceFeePercentage = parseFloat(settings[0].serviceFee) || 10;
      }
    } catch (err) {
      console.warn('Error loading service fee settings:', err);
    }
    
    // Calculate service fee (commission to admin)
    const serviceFee = (basePrice * serviceFeePercentage) / 100;
    
    // Calculate host earnings (base price + cleaning fee - service fee goes to admin)
    const hostEarnings = basePrice + cleaningFee;
    const adminCommission = serviceFee;
    
    const total = basePrice + cleaningFee + serviceFee;

    return { 
      nights, 
      basePrice, 
      cleaningFee, 
      serviceFee, 
      adminCommission,
      hostEarnings,
      total 
    };
  };

  const calculatePricingSync = () => {
    if (!listing || !formData.checkIn || !formData.checkOut) {
      return {
        nights: 0,
        basePrice: 0,
        cleaningFee: listing?.cleaningFee || 0,
        serviceFee: 0,
        adminCommission: 0,
        hostEarnings: 0,
        total: 0,
      };
    }

    const checkInDate = new Date(formData.checkIn);
    const checkOutDate = new Date(formData.checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      return {
        nights: 0,
        basePrice: 0,
        cleaningFee: listing?.cleaningFee || 0,
        serviceFee: 0,
        adminCommission: 0,
        hostEarnings: 0,
        total: 0,
      };
    }

    const basePrice = listing.basePrice * nights;
    const cleaningFee = listing.cleaningFee || 0;
    // Estimate service fee (will be recalculated with actual settings)
    const serviceFee = (basePrice * 10) / 100; // Default 10%
    const total = basePrice + cleaningFee + serviceFee;
    
    // Calculate split
    const hostEarnings = basePrice + cleaningFee; // Host gets base price + cleaning fee
    const adminCommission = serviceFee; // Admin gets service fee

    return { 
      nights, 
      basePrice, 
      cleaningFee, 
      serviceFee, 
      adminCommission,
      hostEarnings,
      total 
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Verification gate — block unverified users
    if (!isEmailVerified) {
      setShowVerifyModal(true);
      return;
    }

    // Validation
    if (!formData.checkIn || !formData.checkOut) {
      setError('Please select check-in and check-out dates');
      return;
    }

    if (!formData.guestName || !formData.guestEmail) {
      setError('Please fill in all required fields');
      return;
    }

    const pricing = calculatePricingSync();
    if (pricing.nights <= 0) {
      setError('Invalid dates selected');
      return;
    }

    // If PayPal is selected, prevent form submission and ensure PayPal buttons are shown
    if (formData.paymentMethod === 'paypal') {
      // Ensure PayPal buttons are visible
      if (!showPayPalButtons) {
        setShowPayPalButtons(true);
      }
      // Initialize PayPal if not already done
      if (!paypalButtons) {
        await initializePayPal();
      }
      // Scroll to PayPal buttons
      setTimeout(() => {
        const container = document.getElementById('paypal-button-container');
        if (container) {
          container.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
      // Don't show error, just inform user
      setError(null);
      return;
    }

    // Validate bank details if bank transfer selected
    if (formData.paymentMethod === 'bank') {
      if (!bankDetails.accountName || !bankDetails.accountNumber || !bankDetails.bankName) {
        setError('Please fill in all required bank account details');
        return;
      }
    }

    setSubmitting(true);

    try {
      // Calculate pricing with commission
      const fullPricing = await calculatePricing();
      
      // Create booking
      const bookingData = {
        listingId: id,
        guestId: currentUser.uid,
        hostId: listing.hostId,
        checkIn: new Date(formData.checkIn).toISOString(),
        checkOut: new Date(formData.checkOut).toISOString(),
        numberOfNights: fullPricing.nights,
        numberOfGuests: formData.guests,
        guestDetails: {
          name: formData.guestName,
          email: formData.guestEmail,
          phone: formData.guestPhone,
          specialRequests: formData.specialRequests,
        },
        basePrice: listing.basePrice,
        cleaningFee: fullPricing.cleaningFee,
        serviceFee: fullPricing.serviceFee,
        totalAmount: fullPricing.total,
        currency: listing.currency || 'USD',
        status: 'pending',
        paymentStatus: 'pending',
        selectedMoodId,
        recommendationSource: selectedMoodId ? 'mood' : 'search',
      };

      const bookingId = await createBooking(bookingData);
      await safeCreateTransactionLog({
        type: TRANSACTION_EVENTS.BOOKING_CREATED,
        userId: currentUser.uid,
        actorId: currentUser.uid,
        bookingId,
        amount: fullPricing.total,
        currency: listing.currency || 'USD',
        paymentMethod: formData.paymentMethod,
        status: 'pending',
        description: `Booking created for ${listing.title}`,
      });

      // Create payment record with commission split
      const paymentData = {
        userId: currentUser.uid,
        bookingId: bookingId,
        hostId: listing.hostId,
        amount: fullPricing.total,
        currency: listing.currency || 'USD',
        fees: {
          serviceFee: fullPricing.serviceFee,
          processingFee: 0,
        },
        // Commission split
        commission: {
          adminCommission: fullPricing.adminCommission,
          hostEarnings: fullPricing.hostEarnings,
          totalAmount: fullPricing.total,
        },
        totalAmount: fullPricing.total,
        method: formData.paymentMethod,
        status: 'pending',
      };

      const paymentId = await createPayment(paymentData);

      // Process payment based on method
      if (formData.paymentMethod === 'e-wallet') {
        const walletResult = await payWithWallet(currentUser.uid, pricing.total, bookingId);
        
        if (walletResult.success) {
          // Complete payment
          await completePayment(paymentId, `wallet-${bookingId}`);
          await safeCreateTransactionLog({
            type: TRANSACTION_EVENTS.PAYMENT_COMPLETED,
            userId: currentUser.uid,
            actorId: currentUser.uid,
            bookingId,
            paymentId,
            externalTransactionId: `wallet-${bookingId}`,
            amount: fullPricing.total,
            currency: listing.currency || 'USD',
            paymentMethod: 'e-wallet',
            status: 'paid',
            description: `Wallet payment completed for booking ${bookingId}`,
          });
          
          // Update booking payment status
          const { updateBooking } = await import('../../services/bookingsService');
          await updateBooking(bookingId, {
            paymentStatus: 'paid',
            paymentId: paymentId,
            paidAt: new Date().toISOString(),
            paymentMethod: 'e-wallet',
            paymentTransactionId: `wallet-${bookingId}`,
            paymentCompletedAt: new Date().toISOString(),
            status: 'confirmed',
            confirmedAt: new Date().toISOString(),
          });
          
          // Credit host wallet with earnings
          if (fullPricing.hostEarnings > 0) {
            try {
              const { creditHostWallet } = await import('../../services/walletService');
              await creditHostWallet(
                listing.hostId,
                fullPricing.hostEarnings,
                bookingId,
                paymentId
              );
              await safeCreateTransactionLog({
                type: TRANSACTION_EVENTS.WALLET_CREDITED,
                userId: listing.hostId,
                actorId: currentUser.uid,
                bookingId,
                paymentId,
                amount: fullPricing.hostEarnings,
                currency: listing.currency || 'USD',
                paymentMethod: 'wallet',
                status: 'completed',
                description: `Host wallet credited from booking ${bookingId}`,
              });
              
              // Notify host
              await safeCreateNotifications([{
                userId: listing.hostId,
                type: 'payment',
                title: 'Earnings added to wallet',
                message: `$${fullPricing.hostEarnings.toFixed(2)} has been added to your wallet from booking ${bookingId}`,
                metadata: { bookingId, paymentId, amount: fullPricing.hostEarnings },
              }]);
            } catch (error) {
              console.error('Error crediting host wallet:', error);
              // Don't fail the booking if wallet credit fails
            }
          }
        } else {
          setError(walletResult.error || 'Payment failed. Please add funds to your wallet.');
          setSubmitting(false);
          return;
        }
      } else if (formData.paymentMethod === 'bank') {
        // Bank transfer - payment status remains pending until host confirms receipt
        // Update payment with bank details
        const { updatePayment } = await import('../../services/paymentsService');
        await updatePayment(paymentId, {
          bankDetails: bankDetails,
          status: 'pending',
          note: 'Awaiting bank transfer confirmation',
        });
        
        // Update booking with bank transfer info
        const { updateBooking } = await import('../../services/bookingsService');
        await updateBooking(bookingId, {
          paymentStatus: 'pending',
          paymentMethod: 'bank',
          paymentNote: 'Bank transfer - awaiting confirmation',
        });
      } else if (formData.paymentMethod === 'paypal') {
        // PayPal payment is handled separately via PayPal buttons
        // This should not be reached if PayPal flow works correctly
        setError('Please complete PayPal payment using the PayPal button.');
        setSubmitting(false);
        return;
      }

      // Create notifications
      await safeCreateNotifications([
        {
          userId: listing.hostId,
          type: 'booking',
          title: formData.paymentMethod === 'e-wallet' ? 'New confirmed booking' : 'New booking request',
          message: formData.paymentMethod === 'e-wallet'
            ? `${formData.guestName} booked ${pricing.nights} nights at ${listing.title}`
            : `${formData.guestName} requested ${pricing.nights} nights at ${listing.title}`,
          metadata: { bookingId, listingId: listing.id },
        },
        {
          userId: currentUser.uid,
          type: 'booking',
          title: formData.paymentMethod === 'e-wallet' ? 'Booking confirmed' : 'Booking submitted',
          message: formData.paymentMethod === 'e-wallet'
            ? `Your booking at ${listing.title} has been confirmed!`
            : `We sent your request to ${listing.title}. We'll update you once the host responds.`,
          metadata: { bookingId },
        },
      ]);
      if (formData.paymentMethod === 'e-wallet') {
        await safeCreateBookingMessage(bookingId, pricing, 'E-wallet');
      }

      // Navigate to booking confirmation
      navigate(`/booking/${bookingId}/confirmation`);

      if (selectedMoodId) {
        try {
          await updateUserMoodPreferences(currentUser.uid, selectedMoodId);
        } catch (preferenceError) {
          console.error('Error updating mood preferences:', preferenceError);
        }
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      setError(err.message || 'Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: listing?.currency || 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="container-custom py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !listing) {
    return (
      <div className="container-custom py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Error</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button onClick={() => navigate('/explore')} className="btn btn-primary">
            Browse Listings
          </button>
        </div>
      </div>
    );
  }

  const pricing = calculatePricingSync();

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container-custom">
        <h1 className="text-3xl font-display font-bold text-foreground mb-8">Complete Your Booking</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Trip Details */}
              <div className="card">
                <h2 className="text-xl font-display font-semibold mb-4">Trip Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">
                      Check-in *
                    </label>
                    <input
                      type="date"
                      className="input"
                      value={formData.checkIn}
                      onChange={(e) => handleChange('checkIn', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">
                      Check-out *
                    </label>
                    <input
                      type="date"
                      className="input"
                      value={formData.checkOut}
                      onChange={(e) => handleChange('checkOut', e.target.value)}
                      min={formData.checkIn || new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-foreground/80 mb-1">
                      Number of Guests *
                    </label>
                    <input
                      type="number"
                      className="input"
                      min="1"
                      max={listing?.maxGuests || 10}
                      value={formData.guests}
                      onChange={(e) => handleChange('guests', parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>
                </div>
                {pricing.nights > 0 && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    {pricing.nights} {pricing.nights === 1 ? 'night' : 'nights'}
                  </p>
                )}
              </div>

              {/* Guest Information */}
              <div className="card">
                <h2 className="text-xl font-display font-semibold mb-4">Guest Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={formData.guestName}
                      onChange={(e) => handleChange('guestName', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      className="input"
                      value={formData.guestEmail}
                      onChange={(e) => handleChange('guestEmail', e.target.value)}
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
                      value={formData.guestPhone}
                      onChange={(e) => handleChange('guestPhone', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">
                      Special Requests
                    </label>
                    <textarea
                      className="input"
                      rows="4"
                      value={formData.specialRequests}
                      onChange={(e) => handleChange('specialRequests', e.target.value)}
                      placeholder="Any special requests or notes for the host..."
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="card">
                <h2 className="text-xl font-display font-semibold mb-4">Payment Method</h2>
                <div className="space-y-3">
                  <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.paymentMethod === 'e-wallet' ? 'border-primary-500 bg-primary/10' : 'border-border hover:bg-background'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="e-wallet"
                      checked={formData.paymentMethod === 'e-wallet'}
                      onChange={(e) => {
                        handleChange('paymentMethod', e.target.value);
                        setShowPayPalButtons(false);
                      }}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">E-Wallet</span>
                        {loadingBalance ? (
                          <span className="text-sm text-muted-foreground">Loading...</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Balance: {formatPrice(walletBalance)}
                          </span>
                        )}
                      </div>
                      {formData.paymentMethod === 'e-wallet' && pricing.total > walletBalance && (
                        <p className="text-sm text-red-600 mt-1">
                          Insufficient balance. Add ${(pricing.total - walletBalance).toFixed(2)} more.
                        </p>
                      )}
                    </div>
                  </label>

                  <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.paymentMethod === 'paypal' ? 'border-primary-500 bg-primary/10' : 'border-border hover:bg-background'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={formData.paymentMethod === 'paypal'}
                      onChange={async (e) => {
                        handleChange('paymentMethod', e.target.value);
                        if (e.target.value === 'paypal') {
                          if (formData.checkIn && formData.checkOut && formData.guestName && formData.guestEmail) {
                            setShowPayPalButtons(true);
                          } else {
                            setShowPayPalButtons(false);
                          }
                        } else {
                          setShowPayPalButtons(false);
                        }
                      }}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">PayPal</span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Secure</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Pay with PayPal account or card</p>
                    </div>
                  </label>

                  {formData.paymentMethod === 'paypal' && (
                    <div className="mt-4 p-4 bg-background rounded-lg space-y-4" id="paypal-section">
                      {!formData.checkIn || !formData.checkOut || !formData.guestName || !formData.guestEmail ? (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="text-sm text-yellow-800">
                            ⚠️ Please fill in trip details and guest information first, then the PayPal button will appear below.
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Payment Type Selection */}
                          <div>
                            <label className="block text-sm font-medium text-foreground/80 mb-2">
                              Payment Amount
                            </label>
                            <div className="space-y-2">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="paymentType"
                                  value="full"
                                  checked={formData.paymentType === 'full'}
                                  onChange={(e) => {
                                    handleChange('paymentType', e.target.value);
                                    setPaypalButtons(null);
                                    setTimeout(() => initializePayPal(), 100);
                                  }}
                                  className="mr-2"
                                />
                                <span className="text-sm">Full Payment ({formatPrice(calculatePricingSync().total)})</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="paymentType"
                                  value="down"
                                  checked={formData.paymentType === 'down'}
                                  onChange={(e) => {
                                    handleChange('paymentType', e.target.value);
                                    setPaypalButtons(null);
                                    setTimeout(() => initializePayPal(), 100);
                                  }}
                                  className="mr-2"
                                />
                                <span className="text-sm">
                                  Down Payment (30% - {formatPrice((calculatePricingSync().total * 0.3))})
                                </span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="paymentType"
                                  value="custom"
                                  checked={formData.paymentType === 'custom'}
                                  onChange={(e) => {
                                    handleChange('paymentType', e.target.value);
                                    setPaypalButtons(null);
                                  }}
                                  className="mr-2"
                                />
                                <span className="text-sm">Custom Amount</span>
                              </label>
                              {formData.paymentType === 'custom' && (
                                <div className="ml-6 mt-2">
                                  <input
                                    type="number"
                                    min={(calculatePricingSync().total * 0.3).toFixed(2)}
                                    max={calculatePricingSync().total.toFixed(2)}
                                    step="0.01"
                                    value={formData.customPaymentAmount || ''}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      handleChange('customPaymentAmount', value);
                                      setPaypalButtons(null);
                                      if (value >= (calculatePricingSync().total * 0.3)) {
                                        setTimeout(() => initializePayPal(), 100);
                                      }
                                    }}
                                    className="input text-sm"
                                    placeholder="Enter amount"
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Minimum: {formatPrice(calculatePricingSync().total * 0.3)} (30% down payment)
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Payment Breakdown */}
                          {pricing.total > 0 && (
                            <div className="p-3 bg-white rounded border border-border">
                              <div className="text-xs font-medium text-foreground/80 mb-2">Payment Breakdown:</div>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Total Amount:</span>
                                  <span className="font-medium">{formatPrice(pricing.total)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Payment Amount:</span>
                                  <span className="font-medium text-primary">{formatPrice(getPaymentAmount())}</span>
                                </div>
                                {getPaymentAmount() < pricing.total && (
                                  <div className="flex justify-between text-orange-600">
                                    <span>Remaining Balance:</span>
                                    <span className="font-medium">{formatPrice(pricing.total - getPaymentAmount())}</span>
                                  </div>
                                )}
                                <div className="pt-2 mt-2 border-t border-border">
                                  <div className="flex justify-between text-muted-foreground">
                                    <span>→ Host Earnings:</span>
                                    <span className="font-medium text-green-600">
                                      {formatPrice((pricing.hostEarnings * getPaymentAmount()) / pricing.total)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-muted-foreground">
                                    <span>→ Admin Commission:</span>
                                    <span className="font-medium text-blue-600">
                                      {formatPrice((pricing.adminCommission * getPaymentAmount()) / pricing.total)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <div id="paypal-button-container" className="min-h-[50px]">
                            {!paypalButtons && (
                              <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                                <p className="text-sm text-muted-foreground">Loading PayPal...</p>
                              </div>
                            )}
                          </div>
                          {getPayPalConfig().isSandbox && (
                            <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                              <p className="text-xs text-blue-800">
                                ⚠️ <strong>Sandbox Mode:</strong> Use PayPal test accounts for testing. 
                                You'll be redirected to PayPal sandbox to complete payment.
                              </p>
                            </div>
                          )}
                          {showPayPalButtons && paypalButtons && (
                            <p className="text-xs text-muted-foreground text-center">
                              Click the PayPal button above to complete your payment
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.paymentMethod === 'bank' ? 'border-primary-500 bg-primary/10' : 'border-border hover:bg-background'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank"
                      checked={formData.paymentMethod === 'bank'}
                      onChange={(e) => {
                        handleChange('paymentMethod', e.target.value);
                        setShowPayPalButtons(false);
                      }}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <span className="font-medium">Bank Transfer</span>
                      <p className="text-sm text-muted-foreground">Direct bank transfer (manual confirmation)</p>
                    </div>
                  </label>

                  {formData.paymentMethod === 'bank' && (
                    <div className="mt-4 p-4 bg-background rounded-lg space-y-3">
                      <p className="text-sm font-medium text-foreground/80">Bank Account Details</p>
                      <div>
                        <label className="block text-sm font-medium text-foreground/80 mb-1">Account Name *</label>
                        <input
                          type="text"
                          className="input"
                          value={bankDetails.accountName}
                          onChange={(e) => setBankDetails({...bankDetails, accountName: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground/80 mb-1">Account Number *</label>
                        <input
                          type="text"
                          className="input"
                          value={bankDetails.accountNumber}
                          onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground/80 mb-1">Bank Name *</label>
                        <input
                          type="text"
                          className="input"
                          value={bankDetails.bankName}
                          onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground/80 mb-1">Routing Number / SWIFT</label>
                        <input
                          type="text"
                          className="input"
                          value={bankDetails.routingNumber}
                          onChange={(e) => setBankDetails({...bankDetails, routingNumber: e.target.value})}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        ⚠️ Your booking will be confirmed after we verify the bank transfer.
                      </p>
                    </div>
                  )}

                  <label className="flex items-center p-4 border-2 border-border rounded-lg cursor-pointer hover:bg-background transition-colors opacity-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={formData.paymentMethod === 'card'}
                      onChange={(e) => handleChange('paymentMethod', e.target.value)}
                      className="mr-3"
                      disabled
                    />
                    <div className="flex-1">
                      <span className="font-medium">Credit/Debit Card</span>
                      <p className="text-sm text-muted-foreground">Coming soon</p>
                    </div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || pricing.nights <= 0 || (formData.paymentMethod === 'e-wallet' && pricing.total > walletBalance)}
                className="w-full btn btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : 'Confirm Booking'}
              </button>
            </form>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 card">
              <h2 className="text-xl font-display font-semibold mb-4">Booking Summary</h2>
              
              {listing && (
                <>
                  <div className="mb-4">
                    {listing.featuredPhoto && (
                      <img
                        src={listing.featuredPhoto}
                        alt={listing.title}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    )}
                    <h3 className="font-semibold text-foreground">{listing.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {listing.location?.city}, {listing.location?.state || listing.location?.country}
                    </p>
                  </div>

                  {pricing.nights > 0 && (
                    <div className="space-y-2 pt-4 border-t border-border">
                      <div className="flex justify-between">
                        <span>{formatPrice(listing.basePrice)} × {pricing.nights} nights</span>
                        <span>{formatPrice(pricing.basePrice)}</span>
                      </div>
                      {pricing.cleaningFee > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Cleaning fee</span>
                          <span>{formatPrice(pricing.cleaningFee)}</span>
                        </div>
                      )}
                      {pricing.serviceFee > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Service fee</span>
                          <span>{formatPrice(pricing.serviceFee)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                        <span>Total</span>
                        <span>{formatPrice(pricing.total)}</span>
                      </div>
                      
                      {/* Payment Split Breakdown */}
                      {formData.paymentMethod === 'paypal' && pricing.total > 0 && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-xs font-medium text-foreground/80 mb-2">Payment Split:</p>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between text-muted-foreground">
                              <span>Host Earnings:</span>
                              <span className="font-medium text-green-600">{formatPrice(pricing.hostEarnings)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                              <span>Admin Commission:</span>
                              <span className="font-medium text-blue-600">{formatPrice(pricing.adminCommission)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-gray-100">
                              Commission ({((pricing.serviceFee / pricing.basePrice) * 100).toFixed(0)}%) goes to platform administration
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {pricing.serviceFee > 0 && formData.paymentMethod !== 'paypal' && (
                        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                          Service fee goes to platform administration
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Email Verification Modal — fallback gate */}
      <VerificationModal
        isOpen={showVerifyModal || (!isEmailVerified && !loading && !!currentUser)}
        onClose={() => {
          setShowVerifyModal(false);
          navigate(-1);
        }}
        onVerified={() => setShowVerifyModal(false)}
      />
    </div>
  );
}

export default Booking;
