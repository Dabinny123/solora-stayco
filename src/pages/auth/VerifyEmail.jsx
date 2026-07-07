import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applyActionCode, checkActionCode } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';
import { sendVerificationEmail } from '../../auth/authService';

function VerifyEmail() {
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('We are confirming your verification link.');
  const [resending, setResending] = useState(false);
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const mode = params.get('mode');
  const oobCode = params.get('oobCode');

  useEffect(() => {
    let cancelled = false;

    async function verifyEmailCode() {
      if (mode !== 'verifyEmail' || !oobCode) {
        setStatus('info');
        setMessage('Open the verification email we sent and click the link inside to activate your account.');
        return;
      }

      try {
        await checkActionCode(auth, oobCode);
        await applyActionCode(auth, oobCode);
        if (auth.currentUser) {
          await auth.currentUser.reload();
        }
        if (!cancelled) {
          setStatus('success');
          setMessage('Your email has been verified successfully. You can now sign in and continue your journey.');
        }
      } catch (error) {
        if (!cancelled) {
          setStatus('error');
          setMessage(
            error.code === 'auth/expired-action-code'
              ? 'This verification link has expired. Please request a new one.'
              : 'This verification link is invalid or has already been used.'
          );
        }
      }
    }

    verifyEmailCode();
    return () => {
      cancelled = true;
    };
  }, [mode, oobCode]);

  const handleResend = async () => {
    setResending(true);
    try {
      await sendVerificationEmail();
      setStatus('info');
      setMessage('A fresh verification email has been sent. Please check your inbox and spam folder.');
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'We could not resend the verification email. Please sign in and try again.');
    } finally {
      setResending(false);
    }
  };

  const title = {
    checking: 'Checking your link',
    success: 'Email verified',
    error: 'Verification needs attention',
    info: 'Check your email',
  }[status];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full">
        <div className="bg-card border border-border rounded-2xl shadow-large p-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {status === 'checking' && (
              <svg className="h-7 w-7 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            {status === 'success' && (
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {(status === 'error' || status === 'info') && (
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
          </div>

          <h1 className="text-3xl font-display font-bold text-foreground">{title}</h1>
          <p className="mt-3 text-muted-foreground">{message}</p>

          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signin" className="btn btn-primary inline-flex justify-center">
              Go to Sign In
            </Link>
            {status !== 'success' && (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="btn btn-outline inline-flex justify-center disabled:opacity-60"
              >
                {resending ? 'Sending...' : 'Resend Email'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
