import { useLocation, Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail } from 'lucide-react';
import { useState, useEffect } from 'react';

import { useResendVerification } from '../../features/auth/auth.api'; // Adjust path
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';

/**
 * A page shown to users after registration, prompting them to check their email
 * for a verification link. Provides an option to resend the email.
 */
export function PendingVerificationPage() {
  const { t } = useTranslation(['auth', 'common']);
  const location = useLocation();
  const email = location.state?.email as string | undefined;

  const { mutate: resendVerification, isPending } = useResendVerification();
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResendClick = () => {
    if (email) {
      resendVerification({ email });
      setCooldown(60); // Set a 60-second cooldown
    }
  };

  // If the user lands on this page without an email in the state (e.g., direct navigation),
  // it's better to redirect them to a more useful page like login.
  if (!email) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Card className="w-full max-w-lg shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="mt-4 text-2xl font-bold">{t('auth:verify_your_email_title', 'Verify Your Email')}</CardTitle>
        <CardDescription>
          {t('auth:verification_sent_description', 'We have sent a verification link to your email address. Please check your inbox (and spam folder) to activate your account.')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center bg-background-subtle p-4 rounded-md">
          <p className="text-sm text-text-muted">{t('auth:email_sent_to', 'Email sent to:')}</p>
          <p className="font-semibold text-text">{email}</p>
        </div>
        
        <Button
          onClick={handleResendClick}
          disabled={isPending || cooldown > 0}
          className="w-full"
          size="lg"
        >
          {isPending
            ? t('common:sending', 'Sending...')
            : cooldown > 0
            ? t('auth:resend_in_seconds', `Resend in ${cooldown}s`, { seconds: cooldown })
            : t('auth:resend_verification_email', 'Resend Verification Email')}
        </Button>

        <div className="text-center text-sm">
          <p className="text-text-muted">
            {t('auth:wrong_email', 'Used the wrong email?')}{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              {t('auth:register_again', 'Register again')}
            </Link>
          </p>
          <p className="text-text-muted mt-2">
            <Link to="/login" className="font-semibold text-primary hover:underline">
              {t('auth:back_to_login', 'Back to Login')}
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}