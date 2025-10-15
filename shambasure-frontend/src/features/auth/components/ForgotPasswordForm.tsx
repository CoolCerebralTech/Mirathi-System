// FILE: src/features/auth/components/ForgotPasswordForm.tsx

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowLeft } from 'lucide-react';
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
import { Alert, AlertDescription } from '../../../components/ui/Alert';

/**
 * A form for users to request a password reset link.
 * It also includes a success view shown after the request is submitted.
 */
export function ForgotPasswordForm() {
  const { t } = useTranslation(['auth', 'validation', 'common']);
  const { mutate: forgotPassword, isPending } = useForgotPassword();
  const [emailSentTo, setEmailSentTo] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (formData: ForgotPasswordInput) => {
    forgotPassword(formData, {
      onSuccess: () => {
        setEmailSentTo(formData.email);
        toast.success(t('auth:password_reset_sent_title'));
      },
      onError: (error) => {
        toast.error(t('auth:password_reset_failed_title'), {
          description: extractErrorMessage(error),
        });
      },
    });
  };

  if (emailSentTo) {
    return (
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {t('auth:check_your_email_title')}
          </CardTitle>
          <CardDescription>
            {t('auth:reset_link_sent_to')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="success" className="justify-center">
            <Mail className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <strong>{emailSentTo}</strong>
            </AlertDescription>
          </Alert>

          <p className="text-sm text-center text-muted-foreground">
            {t('auth:did_not_receive_email_prompt')}
          </p>

          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={() => setEmailSentTo(null)}
              className="w-full"
            >
              {t('auth:try_another_email')}
            </Button>
            <Button variant="ghost" asChild className="w-full">
              <Link to="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('auth:back_to_login')}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('auth:forgot_password_title')}</CardTitle>
        <CardDescription>
          {t('auth:forgot_password_description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth:email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              leftIcon={<Mail className="text-muted-foreground" size={16} />}
              disabled={isPending}
              aria-invalid={!!errors.email}
              aria-describedby="email-error"
              {...register('email')}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" isLoading={isPending}>
            {t('auth:send_reset_link')}
          </Button>
        </form>

        <div className="mt-4">
          <Button variant="ghost" asChild className="w-full">
            <Link to="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('auth:back_to_login')}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
