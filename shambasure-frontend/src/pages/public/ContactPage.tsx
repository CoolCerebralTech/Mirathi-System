// FILE: src/pages/public/ContactPage.tsx

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Label } from '../../components/ui/Label';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// FORM SCHEMA
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const ContactFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters long'),
});

type ContactFormInput = z.infer<typeof ContactFormSchema>;

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

/**
 * The public-facing "Contact Us" page, featuring a contact form and contact details.
 */
export function ContactPage() {
  const { t } = useTranslation(['contact', 'validation']);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormInput>({
    resolver: zodResolver(ContactFormSchema),
  });

  // Simulate form submission
  const onSubmit = async (data: ContactFormInput) => {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay
    console.log('Contact Form Submitted:', data);
    toast.success(t('toasts.submit_success_title'), {
      description: t('toasts.submit_success_description'),
    });
    reset();
  };

  const contactInfo = [
    { icon: Mail, titleKey: 'info.email_title', value: 'support@shambasure.com', href: 'mailto:support@shambasure.com' },
    { icon: Phone, titleKey: 'info.phone_title', value: '+254 712 345 678', href: 'tel:+254712345678' },
    { icon: MapPin, titleKey: 'info.address_title', value: '123 Ngong Road, Nairobi, Kenya' },
  ];

  return (
    <div>
      {/* --- Hero Section --- */}
      <section className="bg-primary/5 py-24 text-center">
        <div className="container">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">{t('hero.title')}</h1>
          <p className="mt-6 text-lg text-muted-foreground sm:text-xl">{t('hero.subtitle')}</p>
        </div>
      </section>

      {/* --- Main Content Section --- */}
      <section className="py-20">
        <div className="container grid gap-16 lg:grid-cols-2">
          {/* Contact Form */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">{t('form.title')}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t('form.first_name')}</Label>
                  <Input id="firstName" disabled={isSubmitting} aria-invalid={!!errors.firstName} aria-describedby="firstName-error" {...register('firstName')} />
                  {errors.firstName && <p id="firstName-error" className="text-sm text-destructive">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t('form.last_name')}</Label>
                  <Input id="lastName" disabled={isSubmitting} aria-invalid={!!errors.lastName} aria-describedby="lastName-error" {...register('lastName')} />
                  {errors.lastName && <p id="lastName-error" className="text-sm text-destructive">{errors.lastName.message}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('form.email')}</Label>
                <Input id="email" type="email" disabled={isSubmitting} aria-invalid={!!errors.email} aria-describedby="email-error" {...register('email')} />
                {errors.email && <p id="email-error" className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">{t('form.message')}</Label>
                <Textarea id="message" rows={5} disabled={isSubmitting} aria-invalid={!!errors.message} aria-describedby="message-error" {...register('message')} />
                {errors.message && <p id="message-error" className="text-sm text-destructive">{errors.message.message}</p>}
              </div>
              <Button type="submit" size="lg" isLoading={isSubmitting}>{t('form.send_button')}</Button>
            </form>
          </div>
          
          {/* Contact Info */}
          <div className="space-y-8">
            <h2 className="text-3xl font-bold tracking-tight">{t('info.title')}</h2>
            <div className="space-y-6">
              {contactInfo.map((item) => (
                <ContactInfoItem key={item.titleKey} icon={item.icon} title={t(item.titleKey)} value={item.value} href={item.href} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// CHILD COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

interface ContactInfoItemProps {
  icon: React.ElementType;
  title: string;
  value: string;
  href?: string;
}

function ContactInfoItem({ icon: Icon, title, value, href }: ContactInfoItemProps) {
  const content = (
    <>
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-muted-foreground">{value}</p>
      </div>
    </>
  );

  if (href) {
    return (
      <a href={href} className="flex items-start gap-4 group">
        {content}
      </a>
    );
  }

  return <div className="flex items-start gap-4">{content}</div>;
}
