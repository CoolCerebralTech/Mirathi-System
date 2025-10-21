// ============================================================================
// ForgotPasswordForm.tsx - Password Reset Request Form Component
// ============================================================================
// Production-ready password reset form with email validation, success state,
// retry mechanism, and comprehensive user guidance.
// ============================================================================

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Mail,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { ForgotPasswordSchema, type ForgotPasswordInput } from '../../../types';
import { useForgotPassword } from '../auth.api';
import { extractErrorMessage } from '../../../api/client';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/Alert';

// ============================================================================
// SUCCESS STATE COMPONENT
// ============================================================================

interface SuccessStateProps {
  email: string;
  onTryAgain: () => void;
}

function SuccessState({ email, onTryAgain }: SuccessStateProps) {
  const { t } = useTranslation(['auth', 'common']);
  const [resendCooldown, setResendCooldown] = useState(60); // 60 seconds cooldown
  const [isResending, setIsResending] = useState(false);

  // Countdown timer for resend cooldown
  useState(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  });

  const handleResend = () => {
    setIsResending(true);
    onTryAgain();
    setResendCooldown(60);
    setIsResending(false);
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-3 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <CardTitle className="text-2xl font-bold">
          {t('auth:check_your_email_title')}
        </CardTitle>
        <CardDescription className="text-base">
          {t('auth:reset_link_sent_description')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Email Display */}
        <Alert className="border-primary/50 bg-primary/5">
          <Mail className="h-4 w-4 text-primary" />
          <AlertTitle className="text-sm font-medium">
            {t('auth:email_sent_to')}
          </AlertTitle>
          <AlertDescription className="mt-1">
            <span className="font-semibold text-foreground">{email}</span>
          </AlertDescription>
        </Alert>

        {/* Instructions */}
        <div className="space-y-3 rounded-lg border border-muted bg-muted/30 p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <HelpCircle size={16} className="text-muted-foreground" />
            {t('auth:next_steps')}
          </h4>
          <ol className="ml-6 list-decimal space-y-2 text-sm text-muted-foreground">
            <li>{t('auth:check_email_inbox')}</li>
            <li>{t('auth:click_reset_link')}</li>
            <li>{t('auth:create_new_password')}</li>
          </ol>
        </div>

        {/* Token Expiry Warning */}
        <Alert variant="warning" className="bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800">
          <Clock className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {t('auth:reset_link_expires')}
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Resend Email */}
          <Button
            variant="outline"
            onClick={handleResend}
            disabled={resendCooldown > 0 || isResending}
            className="w-full"
            isLoading={isResending}
          >
            {resendCooldown > 0
              ? t('auth:resend_in_seconds', { seconds: resendCooldown })
              : t('auth:resend_email')}
          </Button>

          {/* Try Different Email */}
          <Button
            variant="ghost"
            onClick={onTryAgain}
            className="w-full"
            disabled={isResending}
          >
            {t('auth:try_another_email')}
          </Button>

          {/* Back to Login */}
          <Button
            variant="ghost"
            asChild
            className="w-full text-muted-foreground hover:text-foreground"
          >
            <Link to="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('auth:back_to_login')}
            </Link>
          </Button>
        </div>

        {/* Help Text */}
        <div className="rounded-md bg-muted/50 p-3 text-center">
          <p className="text-xs text-muted-foreground">
            {t('auth:no_email_received')}{' '}
            <Link
              to="/contact-support"
              className="font-medium text-primary hover:underline"
            >
              {t('auth:contact_support')}
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN FORGOT PASSWORD FORM
// ============================================================================

/**
 * Forgot password form component.
 * 
 * FEATURES:
 * - Email validation
 * - Loading states
 * - Success state with instructions
 * - Resend functionality with cooldown
 * - Try different email option
 * - Back to login navigation
 * - Security notice about generic responses
 * 
 * SECURITY:
 * - Generic response prevents user enumeration
 * - Rate limiting on backend
 * - Token expiration (1 hour)
 * - Single-use tokens
 * 
 * UX:
 * - Clear instructions post-submission
 * - Visual feedback (icons, colors)
 * - Countdown timer for resend
 * - Help/support links
 */
export function ForgotPasswordForm() {
  const { t } = useTranslation(['auth', 'validation', 'common']);
  const { mutate: forgotPassword, isPending } = useForgotPassword();
  const [emailSentTo, setEmailSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
    },
  });

  /**
   * Form submission handler
   * Sends password reset request to API
   */
  const onSubmit = (formData: ForgotPasswordInput) => {
    forgotPassword(formData, {
      onSuccess: (response) => {
        setEmailSentTo(formData.email);
        toast.success(t('auth:password_reset_sent_title'), {
          description: response.message || t('auth:password_reset_sent_description'),
          duration: 4000,
        });
      },
      onError: (error) => {
        const errorMessage = extractErrorMessage(error);
        toast.error(t('auth:password_reset_failed_title'), {
          description: errorMessage,
          duration: 5000,
        });
      },
    });
  };

  /**
   * Reset form to try with different email
   */
  const handleTryAgain = () => {
    setEmailSentTo(null);
    reset();
  };

  // Show success state if email was sent
  if (emailSentTo) {
    return <SuccessState email={emailSentTo} onTryAgain={handleTryAgain} />;
  }

  // Show form for email input
  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <KeyRound className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">
          {t('auth:forgot_password_title')}
        </CardTitle>
        <CardDescription className="text-base">
          {t('auth:forgot_password_description')}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email" required>
              {t('auth:email')}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="email"
                type="email"
                placeholder={t('auth:email_placeholder')}
                autoComplete="email"
                autoFocus
                disabled={isPending}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : 'email-help'}
                className="pl-10"
                {...register('email')}
              />
            </div>
            
            {/* Help Text */}
            {!errors.email && (
              <p id="email-help" className="text-xs text-muted-foreground">
                {t('auth:enter_account_email')}
              </p>
            )}

            {/* Error Message */}
            {errors.email && (
              <p
                id="email-error"
                className="text-sm text-destructive flex items-center gap-1"
                role="alert"
              >
                <AlertCircle size={14} />
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Security Notice */}
          <Alert className="bg-muted/50 border-muted">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {t('auth:password_reset_security_notice')}
            </AlertDescription>
          </Alert>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isPending}
            disabled={isPending || !isValid}
          >
            {isPending ? t('auth:sending_reset_link') : t('auth:send_reset_link')}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-muted" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              {t('common:or')}
            </span>
          </div>
        </div>

        {/* Back to Login */}
        <div className="space-y-2">
          <Button
            variant="outline"
            asChild
            className="w-full"
            disabled={isPending}
          >
            <Link to="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('auth:back_to_login')}
            </Link>
          </Button>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-muted-foreground">
            {t('auth:no_account')}{' '}
            <Link
              to="/register"
              className="font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
              tabIndex={isPending ? -1 : 0}
            >
              {t('auth:sign_up_now')}
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
