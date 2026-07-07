// Verification Modal for Solora StayCo
// Premium animated modal for email verification with 6-digit code input.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sendVerificationCode, verifyCode } from '../services/emailVerificationService';
import { useAuth } from '../contexts/AuthContext';

/**
 * VerificationModal — shown when an unverified user tries to book.
 *
 * Props:
 *   isOpen       — controls visibility
 *   onClose      — called when user closes modal
 *   onVerified   — called after successful verification
 */
function VerificationModal({ isOpen, onClose, onVerified }) {
  const { currentUser, userData, refreshUserData } = useAuth();
  const [step, setStep] = useState('prompt'); // 'prompt' | 'code' | 'success'
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);
  const [isMockMode, setIsMockMode] = useState(false);
  const inputRefs = useRef([]);
  const cooldownRef = useRef(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('prompt');
      setSending(false);
      setVerifying(false);
      setError('');
      setDigits(['', '', '', '', '', '']);
      setCooldown(0);
      setIsMockMode(false);
    }
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [isOpen]);

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown > 0) {
      cooldownRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(cooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [cooldown]);

  const handleSendCode = useCallback(async () => {
    if (!currentUser?.email) return;
    setSending(true);
    setError('');
    setIsMockMode(false);
    try {
      const res = await sendVerificationCode(
        currentUser.email,
        userData?.displayName || currentUser.displayName || ''
      );
      
      if (res?.isMock) {
        setIsMockMode(true);
      }
      
      setStep('code');
      setCooldown(60);
      // Auto-focus first input
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    } catch (err) {
      const msg = err?.message || err?.code || 'Failed to send verification code.';
      setError(msg.replace('Firebase: ', '').replace(/\(.*\)/, '').trim());
    } finally {
      setSending(false);
    }
  }, [currentUser, userData]);

  const handleDigitChange = (index, value) => {
    // Allow only digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError('');

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are filled
    if (digit && index === 5) {
      const fullCode = [...newDigits.slice(0, 5), digit].join('');
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 0) return;
    const newDigits = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);
    // Focus the next empty or last
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
    // Auto-submit if pasted a full code
    if (pasted.length === 6) {
      handleVerify(pasted);
    }
  };

  const handleVerify = async (codeOverride) => {
    const code = codeOverride || digits.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      const result = await verifyCode(code);
      
      // If it was a mock code run in local dev env, update Firestore directly
      if (result?.isMock) {
        const { updateUser } = await import('../services/usersService');
        await updateUser(currentUser.uid, {
          emailVerified: true,
          emailVerifiedAt: new Date().toISOString()
        });
      }
      
      setStep('success');
      // Refresh user data in context so the rest of the app knows
      if (refreshUserData) await refreshUserData();
      // Notify parent after a short celebration delay
      setTimeout(() => {
        if (onVerified) onVerified();
      }, 1800);
    } catch (err) {
      const msg = err?.message || err?.code || 'Verification failed. Please try again.';
      setError(msg.replace('Firebase: ', '').replace(/\(.*\)/, '').trim());
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen) return null;

  const email = currentUser?.email || '';
  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 6)) + c)
    : '';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={step !== 'success' ? onClose : undefined}
      />

      {/* Modal */}
      <div
        className="relative bg-card rounded-3xl shadow-2xl border border-border w-full max-w-md overflow-hidden"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        {/* Close button */}
        {step !== 'success' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-muted/60 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Gradient header bar */}
        <div
          className="h-2"
          style={{ background: 'linear-gradient(90deg, #7c3aed, #a78bfa, #f59e42)' }}
        />

        <div className="px-8 py-8">
          {/* ── Step 1: Prompt ── */}
          {step === 'prompt' && (
            <div className="text-center">
              <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">
                Verify your email
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-1">
                To complete a booking, we need to verify your email address.
              </p>
              <p className="text-foreground/80 text-sm font-medium mb-6">
                We'll send a 6-digit code to <span className="text-primary">{maskedEmail}</span>
              </p>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-foreground">
                  {error}
                </div>
              )}

              <button
                onClick={handleSendCode}
                disabled={sending}
                className="w-full btn btn-primary py-3.5 rounded-xl text-base font-semibold disabled:opacity-60 transition-all hover:shadow-glow"
              >
                {sending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending code…
                  </span>
                ) : (
                  'Send Verification Code'
                )}
              </button>

              <p className="mt-4 text-xs text-muted-foreground">
                The code will expire in 10 minutes
              </p>
            </div>
          )}

          {/* ── Step 2: Enter Code ── */}
          {step === 'code' && (
            <div className="text-center">
              <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">
                Enter verification code
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                We sent a 6-digit code to <span className="text-primary font-medium">{maskedEmail}</span>
              </p>

              {isMockMode && (
                <div className="mb-6 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary inline-flex items-center gap-1.5 animate-pulse-soft">
                  <span>🛠️</span>
                  <span>Development Fallback Code: <strong className="underline">123456</strong></span>
                </div>
              )}

              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-foreground">
                  {error}
                </div>
              )}

              {/* 6-digit input boxes */}
              <div className="flex justify-center gap-2.5 mb-6" onPaste={handlePaste}>
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    disabled={verifying}
                    className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-border bg-background text-foreground
                               focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none
                               disabled:opacity-50 transition-all"
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={() => handleVerify()}
                disabled={verifying || digits.join('').length !== 6}
                className="w-full btn btn-primary py-3.5 rounded-xl text-base font-semibold disabled:opacity-60 transition-all hover:shadow-glow"
              >
                {verifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Verifying…
                  </span>
                ) : (
                  'Verify Email'
                )}
              </button>

              <div className="mt-5 flex items-center justify-center gap-1 text-sm">
                <span className="text-muted-foreground">Didn't receive it?</span>
                {cooldown > 0 ? (
                  <span className="text-muted-foreground/60 font-medium">
                    Resend in {cooldown}s
                  </span>
                ) : (
                  <button
                    onClick={handleSendCode}
                    disabled={sending}
                    className="text-primary font-medium hover:text-primary/80 transition-colors disabled:opacity-50"
                  >
                    {sending ? 'Sending…' : 'Resend code'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Success ── */}
          {step === 'success' && (
            <div className="text-center py-4">
              <div
                className="mx-auto mb-5 w-20 h-20 rounded-full bg-green-100 flex items-center justify-center"
                style={{ animation: 'scaleIn 0.4s ease-out' }}
              >
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                    style={{
                      strokeDasharray: 24,
                      strokeDashoffset: 24,
                      animation: 'drawCheck 0.5s 0.2s ease-out forwards',
                    }}
                  />
                </svg>
              </div>
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">
                Email verified!
              </h2>
              <p className="text-muted-foreground text-sm">
                Your email has been verified successfully. You can now proceed with your booking.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Inline keyframe styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.15); }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes drawCheck {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}

export default VerificationModal;
