import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowLeft, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';

import { ForgotPasswordRequestSchema, type ForgotPasswordInput } from '../../../types';
import { useForgotPassword } from '../auth.api';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';

// ============================================================================
// SUCCESS STATE SUB-COMPONENT
// ============================================================================
interface SuccessStateProps {
  email: string;
  onTryAnotherEmail: () => void;
}

function SuccessState({ email, onTryAnotherEmail }: SuccessStateProps) {
  const { t } = useTranslation(['auth', 'common']);
  const { mutate: resend, isPending } = useForgotPassword();
  const [resendCooldown, setResendCooldown] = useState(60);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResend = () => {
    resend({ email }); // Resend to the same email
    setResendCooldown(60);
  };

  return (
    <div className="w-full space-y-8">
      <div className="space-y-4 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-secondary/20 bg-secondary/10 shadow-soft">
          <CheckCircle2 className="h-8 w-8 text-secondary" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
            {t('auth:check_your_email_title', 'Check Your Email')}
          </h1>
          <p className="text-base leading-relaxed text-text-subtle">
            {t('auth:reset_link_sent_description', "We've sent password reset instructions to your email")}
          </p>
        </div>
      </div>
      <div className="rounded-elegant border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 rounded-lg bg-primary/10 p-2"><Mail className="h-5 w-5 text-primary" /></div>
          <div>
            <p className="text-sm font-medium text-text">{t('auth:email_sent_to', 'Email sent to')}</p>
            <p className="mt-1 font-serif text-base font-semibold text-text">{email}</p>
          </div>
        </div>
      </div>
      <div className="space-y-4 rounded-elegant border border-neutral-200 bg-background-subtle p-6">
        <h3 className="font-serif text-lg font-bold text-text">{t('auth:next_steps', 'What to do next')}</h3>
        <ol className="space-y-3 pl-5 text-sm text-text-subtle">
          <li className="flex items-start gap-3"><span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">1</span><span>{t('auth:check_email_inbox', 'Check your email inbox (and spam folder)')}</span></li>
          <li className="flex items-start gap-3"><span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">2</span><span>{t('auth:click_reset_link', 'Click the password reset link in the email')}</span></li>
          <li className="flex items-start gap-3"><span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">3</span><span>{t('auth:create_new_password', 'Create your new password')}</span></li>
        </ol>
      </div>
      <div className="space-y-3">
        <Button variant="outline" onClick={handleResend} disabled={resendCooldown > 0 || isPending} className="w-full">
          {resendCooldown > 0 ? t('auth:resend_in_seconds', `Resend in ${resendCooldown}s`, { seconds: resendCooldown }) : t('auth:resend_email', 'Resend Email')}
        </Button>
        <Button variant="outline" onClick={onTryAnotherEmail} className="w-full">{t('auth:try_another_email', 'Try Another Email')}</Button>
      </div>
      <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-200" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-3 font-medium text-text-muted">{t('common:or', 'Or')}</span></div></div>
      <div className="text-center">
        <Link to="/login" className="inline-flex items-center gap-2 rounded font-serif text-base font-semibold text-primary transition-all duration-300 hover:text-primary-hover hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
          <ArrowLeft className="h-4 w-4" />{t('auth:back_to_login', 'Back to Sign In')}
        </Link>
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
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordRequestSchema),
    mode: 'onTouched',
    defaultValues: { email: '' },
  });

  const onSubmit = (formData: ForgotPasswordInput) => {
    forgotPassword(formData, {
      onSuccess: () => {
        // The success toast is handled by the hook.
        // We just need to update the UI state to show the success screen.
        setEmailSentTo(formData.email);
      },
      onError: (error) => {
        // The error toast is handled by the hook.
        console.error("Forgot password form error:", error);
      }
    });
  };

  if (emailSentTo) {
    return <SuccessState email={emailSentTo} onTryAnotherEmail={() => { setEmailSentTo(null); reset(); }} />;
  }

  return (
    <div className="w-full space-y-8">
      <div className="space-y-4 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/5 shadow-soft"><KeyRound className="h-8 w-8 text-primary" /></div>
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">{t('auth:forgot_password_title', 'Reset Your Password')}</h1>
          <p className="text-base leading-relaxed text-text-subtle">{t('auth:forgot_password_description', "Enter your email and we'll send you instructions to reset your password")}</p>
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email" className="font-serif text-sm font-semibold text-text">{t('auth:email', 'Email Address')}<span className="ml-1 text-danger">*</span></Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              id="email"
              type="email"
              placeholder={t('auth:email_placeholder', 'you@example.com')}
              autoComplete="email"
              autoFocus
              disabled={isPending}
              className={`pl-10 ${errors.email ? 'border-danger focus:border-danger focus:ring-danger/20' : 'border-neutral-300 focus:border-primary focus:ring-primary/20'}`}
              {...register('email')}
            />
          </div>
          {errors.email && <p className="flex items-center gap-1.5 text-sm text-danger"><AlertCircle size={14} /><span>{errors.email.message}</span></p>}
        </div>
        <Button type="submit" className="w-full" size="lg" isLoading={isPending} disabled={isPending}>
          {isPending ? t('auth:sending_reset_link', 'Sending...') : t('auth:send_reset_link', 'Send Reset Link')}
        </Button>
      </form>
      <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-200" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-3 font-medium text-text-muted">{t('common:or', 'Or')}</span></div></div>
      <div className="text-center">
        <Link to="/login" className="inline-flex items-center gap-2 rounded font-serif text-base font-semibold text-primary transition-all duration-300 hover:text-primary-hover hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
          <ArrowLeft className="h-4 w-4" />{t('auth:back_to_login', 'Back to Sign In')}
        </Link>
      </div>
    </div>
  );
}