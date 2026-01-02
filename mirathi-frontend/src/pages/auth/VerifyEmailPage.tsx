import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MailCheck, AlertTriangle } from 'lucide-react';

import { useVerifyEmail } from '../../features/auth/auth.api';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

/**
 * A page to handle email verification by processing a token from the URL.
 * It shows loading, success, and error states to the user.
 */
export function VerifyEmailPage() {
  const { t } = useTranslation(['auth', 'common']);
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const { mutate: verifyEmail, isPending, isSuccess, isError, error, data } = useVerifyEmail();

  useEffect(() => {
    if (token) {
      verifyEmail({ token });
    }
  }, [token, verifyEmail]);

  // Loading State
  if (isPending || !token) {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <LoadingSpinner size="lg" />
        <h1 className="text-2xl font-semibold">{t('auth:verifying_email_title', 'Verifying Your Email...')}</h1>
        <p className="text-text-muted">{t('auth:please_wait', 'Please wait a moment.')}</p>
      </div>
    );
  }

  // Success State
  if (isSuccess && data?.success) {
    return (
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10">
            <MailCheck className="h-8 w-8 text-secondary" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold">{t('auth:email_verified_title', 'Email Verified!')}</CardTitle>
          <CardDescription>{t('auth:email_verified_success', 'Your account is now fully activated. Welcome aboard!')}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild size="lg" className="w-full">
            <Link to="/dashboard">{t('auth:go_to_dashboard', 'Go to Dashboard')}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Error State
  if (isError || !data?.success) {
    const errorMessage = error ? (error as Error).message : t('auth:invalid_verification_link_description', 'This link may be expired or invalid.');
    return (
      <Card className="w-full max-w-md shadow-lg border-danger">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
            <AlertTriangle className="h-8 w-8 text-danger" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold">{t('auth:verification_failed_title', 'Verification Failed')}</CardTitle>
          <CardDescription>{errorMessage}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-text-muted">{t('auth:request_new_verification_link', 'Would you like to request a new verification link?')}</p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/pending-verification">{t('auth:resend_verification_email', 'Resend Verification Email')}</Link>
          </Button>
          <Button asChild className="w-full">
            <Link to="/login">{t('auth:back_to_login', 'Back to Login')}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}