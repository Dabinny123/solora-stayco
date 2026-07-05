import React from 'react';
import { Link } from 'react-router-dom';

function VerifyEmail() {
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const mode = params.get('mode');
  const status = mode === 'verifyEmail' ? 'verified' : 'info';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-6 text-center">
        {status === 'verified' ? (
          <>
            <h1 className="text-3xl font-display font-bold text-foreground">Email Verified 🎉</h1>
            <p className="text-muted-foreground">
              Your email has been verified successfully. You can now sign in and explore Solora StayCo.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-display font-bold text-foreground">Check Your Email</h1>
            <p className="text-muted-foreground">
              Please open the verification email we sent and click the link inside to activate your account.
            </p>
          </>
        )}

        <Link to="/signin" className="btn btn-primary inline-flex justify-center">
          Go to Sign In
        </Link>
      </div>
    </div>
  );
}

export default VerifyEmail;

