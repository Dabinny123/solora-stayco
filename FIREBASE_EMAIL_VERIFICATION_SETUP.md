# Firebase Email Verification Setup

Firebase Auth sends verification email through Google's email infrastructure. The app can request and verify the link, but inbox delivery still depends on recipient address quality, spam filters, domain reputation, and provider rules.

## Recommended Firebase Template

Go to Firebase Console -> Authentication -> Templates -> Email address verification.

Use this copy:

Subject:

```text
Verify your Solora StayCo email
```

Message:

```text
Hi %DISPLAY_NAME%,

Welcome to Solora StayCo. Please verify this email address so we can protect your account and unlock your staycation experience.

Click the link below to verify your account:

%LINK%

If you did not create a Solora StayCo account, you can ignore this email.

Solora StayCo
Mood-based staycations, made personal.
```

## Important Console Settings

1. Add your live domain in Authentication -> Settings -> Authorized domains.
2. Set the action URL/domain to your deployed site when Firebase prompts for it.
3. Add this Vercel environment variable:

```text
VITE_EMAIL_VERIFICATION_REDIRECT=https://YOUR-VERCEL-DOMAIN/verify-email
```

4. Redeploy Vercel after adding the env var.

## Better Deliverability

Firebase built-in emails are usually reliable, but not guaranteed. To improve delivery:

- Ask users to check spam/promotions.
- Avoid using fake or temporary emails.
- Use a clear subject that mentions Solora StayCo.
- Add your production domain to Firebase Authorized domains.
- For full HTML branding and higher deliverability controls, use a custom email provider such as SendGrid, Mailgun, Resend, or Postmark with Firebase custom email action links.

## What The App Now Does

- Sends verification links to `/verify-email`.
- Applies Firebase verification codes inside the app.
- Detects expired or invalid verification links.
- Lets signed-in users resend a verification email.
