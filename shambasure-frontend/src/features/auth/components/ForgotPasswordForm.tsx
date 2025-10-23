// ============================================================================
// ForgotPasswordForm.tsx - Old Money Refined Password Recovery
// ============================================================================
// Elegant password reset experience with sophisticated design
// ============================================================================

import { useState, useEffect } from 'react';
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
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

import { ForgotPasswordSchema, type ForgotPasswordInput } from '../../../types';
import { useForgotPassword } from '../auth.api';
import { extractErrorMessage } from '../../../api/client';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';

// ============================================================================
// SUCCESS STATE COMPONENT
// ============================================================================

interface SuccessStateProps {
  email: string;
  onTryAgain: () => void;
}

function SuccessState({ email, onTryAgain }: SuccessStateProps) {
  const { t } = useTranslation(['auth', 'common']);
  const [resendCooldown, setResendCooldown] = useState(60);

  useEffect(() => {
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
  }, [resendCooldown]);

  const handleResend = () => {
    onTryAgain();
    setResendCooldown(60);
  };

  return (
    <div className="w-full space-y-8">
      {/* Header - Success State */}
      <div className="space-y-4 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-secondary/20 bg-secondary/10 shadow-soft">
          <CheckCircle2 className="h-8 w-8 text-secondary" />
        </div>
        
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
            {t('auth:check_your_email_title', 'Check Your Email')}
          </h1>
          <p className="text-base leading-relaxed text-text-subtle">
            {t('auth:reset_link_sent_description', 'We\'ve sent password reset instructions to your email')}
          </p>
        </div>
      </div>

      {/* Email Confirmation */}
      <div className="rounded-elegant border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 rounded-lg bg-primary/10 p-2">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-text">
              {t('auth:email_sent_to', 'Email sent to')}
            </p>
            <p className="mt-1 font-serif text-base font-semibold text-text">
              {email}
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="space-y-4 rounded-elegant border border-neutral-200 bg-background-subtle p-6">
        <h3 className="font-serif text-lg font-bold text-text">
          {t('auth:next_steps', 'What to do next')}
        </h3>
        <ol className="space-y-3 pl-5 text-sm text-text-subtle">
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
              1
            </span>
            <span>{t('auth:check_email_inbox', 'Check your email inbox (and spam folder)')}</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
              2
            </span>
            <span>{t('auth:click_reset_link', 'Click the password reset link in the email')}</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
              3
            </span>
            <span>{t('auth:create_new_password', 'Create your new password')}</span>
          </li>
        </ol>
      </div>

      {/* Token Expiry Warning */}
      <div className="rounded-elegant border border-warning/20 bg-warning/5 p-4">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 flex-shrink-0 text-warning" />
          <div>
            <p className="text-sm font-medium text-text">
              {t('auth:reset_link_expires', 'This link expires in 1 hour')}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {t('auth:request_new_link', 'Request a new link if it expires before you use it')}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          variant="outline"
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="w-full border-2 border-neutral-300 font-medium transition-all duration-300 hover:border-primary hover:bg-neutral-50 hover:text-primary"
        >
          {resendCooldown > 0
            ? t('auth:resend_in_seconds', `Resend in ${resendCooldown}s`, { seconds: resendCooldown })
            : t('auth:resend_email', 'Resend Email')}
        </Button>

        <Button
          variant="outline"
          onClick={onTryAgain}
          className="w-full border-2 border-neutral-300 font-medium transition-all duration-300 hover:border-secondary hover:bg-neutral-50 hover:text-secondary"
        >
          {t('auth:try_another_email', 'Try Another Email')}
        </Button>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-3 font-medium text-text-muted">
            {t('common:or', 'Or')}
          </span>
        </div>
      </div>

      {/* Back to Login */}
      <div className="space-y-4 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 rounded font-serif text-base font-semibold text-primary transition-all duration-300 hover:text-primary-hover hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('auth:back_to_login', 'Back to Sign In')}
        </Link>

        {/* Help Text */}
        <div className="rounded-elegant border border-neutral-200 bg-background-subtle p-4">
          <p className="text-xs text-text-muted">
            {t('auth:no_email_received', 'Didn\'t receive the email?')}{' '}
            <Link
              to="/contact"
              className="font-medium text-primary transition-colors hover:text-primary-hover hover:underline"
            >
              {t('auth:contact_support', 'Contact Support')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN FORGOT PASSWORD FORM
// ============================================================================

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

  const onSubmit = (formData: ForgotPasswordInput) => {
    forgotPassword(formData, {
      onSuccess: (response) => {
        setEmailSentTo(formData.email);
        toast.success(t('auth:password_reset_sent_title', 'Reset Link Sent'), {
          description: response.message || t('auth:password_reset_sent_description', 'Check your email for instructions'),
          duration: 4000,
        });
      },
      onError: (error) => {
        const errorMessage = extractErrorMessage(error);
        toast.error(t('auth:password_reset_failed_title', 'Request Failed'), {
          description: errorMessage,
          duration: 5000,
        });
      },
    });
  };

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
    <div className="w-full space-y-8">
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* HEADER - Elegant & Reassuring */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <div className="space-y-4 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/5 shadow-soft">
          <KeyRound className="h-8 w-8 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
            {t('auth:forgot_password_title', 'Reset Your Password')}
          </h1>
          <p className="text-base leading-relaxed text-text-subtle">
            {t('auth:forgot_password_description', 'Enter your email and we\'ll send you instructions to reset your password')}
          </p>
        </div>

        {/* Security Badge */}
        <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-secondary/20 bg-secondary/5 px-4 py-1.5 text-xs font-medium text-secondary">
          <Shield className="h-3.5 w-3.5" />
          <span>{t('auth:secure_process', 'Secure Process')}</span>
        </div>
      </div>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* FORM - Clean & Refined */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        
        {/* Email Input */}
        <div className="space-y-2">
          <Label 
            htmlFor="email" 
            className="font-serif text-sm font-semibold text-text"
          >
            {t('auth:email', 'Email Address')}
            <span className="ml-1 text-danger">*</span>
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              id="email"
              type="email"
              placeholder={t('auth:email_placeholder', 'you@example.com')}
              autoComplete="email"
              autoFocus
              disabled={isPending}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : 'email-help'}
              className={`
                pl-10 
                border-neutral-300 bg-background 
                transition-all duration-300 
                focus:border-primary focus:ring-2 focus:ring-primary/20
                ${errors.email ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}
              `}
              {...register('email')}
            />
          </div>
          
          {/* Help Text */}
          {!errors.email && (
            <p id="email-help" className="text-xs text-text-muted">
              {t('auth:enter_account_email', 'Enter the email associated with your account')}
            </p>
          )}

          {/* Error Message */}
          {errors.email && (
            <p
              id="email-error"
              className="flex items-center gap-1.5 text-sm text-danger"
              role="alert"
            >
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{errors.email.message}</span>
            </p>
          )}
        </div>

        {/* Security Notice */}
        <div className="rounded-elegant border border-secondary/20 bg-secondary/5 p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 flex-shrink-0 text-secondary" />
            <p className="text-xs leading-relaxed text-text-subtle">
              {t('auth:password_reset_security_notice', 'For security, we send reset instructions to registered emails only. You\'ll receive an email whether or not an account exists with this address.')}
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-primary font-sans text-base font-semibold text-primary-foreground shadow-soft transition-all duration-300 hover:bg-primary-hover hover:shadow-lifted"
          size="lg"
          isLoading={isPending}
          disabled={isPending || !isValid}
        >
          {isPending ? t('auth:sending_reset_link', 'Sending...') : t('auth:send_reset_link', 'Send Reset Link')}
        </Button>
      </form>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* DIVIDER */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-3 font-medium text-text-muted">
            {t('common:or', 'Or')}
          </span>
        </div>
      </div>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* NAVIGATION LINKS */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <div className="space-y-4 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 rounded font-serif text-base font-semibold text-primary transition-all duration-300 hover:text-primary-hover hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('auth:back_to_login', 'Back to Sign In')}
        </Link>

        <p className="text-sm text-text-subtle">
          {t('auth:no_account', 'Don\'t have an account yet?')}{' '}
          <Link
            to="/register"
            className="font-serif font-semibold text-primary transition-colors hover:text-primary-hover hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            tabIndex={isPending ? -1 : 0}
          >
            {t('auth:sign_up_now', 'Create Your Account')}
          </Link>
        </p>
      </div>
    </div>
  );
}
