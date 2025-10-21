// FILE: src/pages/public/ContactPage.tsx
// VERSION 3: Production-ready with strict typing & i18n-safe validation

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
// FORM SCHEMA (with i18n keys for messages)
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const ContactFormSchema = z.object({
  firstName: z.string().min(1, { message: 'validation.first_name_required' }),
  lastName: z.string().min(1, { message: 'validation.last_name_required' }),
  email: z.string().email({ message: 'validation.invalid_email' }),
  message: z.string().min(10, { message: 'validation.message_too_short' }),
});

type ContactFormInput = z.infer<typeof ContactFormSchema>;

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

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

  const onSubmit = async (data: ContactFormInput) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('Contact Form Submitted:', data);
    toast.success(t('toasts.submit_success_title', 'Message sent!'), {
      description: t('toasts.submit_success_description', 'We will get back to you shortly.'),
    });
    reset();
  };

  const contactInfo: ContactInfoItemProps[] = [
    {
      icon: Mail,
      titleKey: 'info.email_title',
      value: 'support@shambasure.com',
      href: 'mailto:support@shambasure.com',
    },
    {
      icon: Phone,
      titleKey: 'info.phone_title',
      value: '+254 712 345 678',
      href: 'tel:+254712345678',
    },
    {
      icon: MapPin,
      titleKey: 'info.address_title',
      value: '123 Ngong Road, Nairobi, Kenya',
    },
  ];
  

  return (
    <div className="bg-background font-sans text-text animate-fade-in">
      {/* --- Hero Section --- */}
      <section className="border-b border-neutral-200 bg-background-subtle">
        <div className="container max-w-5xl py-24 text-center sm:py-32">
          <h1 className="font-display text-display tracking-tight">
            {t('hero.title', 'Get in Touch')}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-subtle">
            {t(
              'hero.subtitle',
              "We're here to help. Whether you have a question about features, trials, or anything else, our team is ready to answer all your questions."
            )}
          </p>
        </div>
      </section>

      {/* --- Main Content Section --- */}
      <section className="py-20 lg:py-28">
        <div className="container grid max-w-7xl gap-16 lg:grid-cols-5">
          {/* Contact Form */}
          <div className="space-y-8 lg:col-span-3 animate-slide-up">
            <h2 className="font-serif text-3xl font-bold tracking-tight">
              {t('form.title', 'Send us a Message')}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="font-semibold">
                    {t('form.first_name')}
                  </Label>
                  <Input id="firstName" disabled={isSubmitting} {...register('firstName')} />
                  {errors.firstName?.message && (
                    <p className="text-sm text-danger-dark">{t(errors.firstName.message)}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="font-semibold">
                    {t('form.last_name')}
                  </Label>
                  <Input id="lastName" disabled={isSubmitting} {...register('lastName')} />
                  {errors.lastName?.message && (
                    <p className="text-sm text-danger-dark">{t(errors.lastName.message)}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold">
                  {t('form.email')}
                </Label>
                <Input id="email" type="email" disabled={isSubmitting} {...register('email')} />
                {errors.email?.message && (
                  <p className="text-sm text-danger-dark">{t(errors.email.message)}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="message" className="font-semibold">
                  {t('form.message')}
                </Label>
                <Textarea id="message" rows={6} disabled={isSubmitting} {...register('message')} />
                {errors.message?.message && (
                  <p className="text-sm text-danger-dark">{t(errors.message.message)}</p>
                )}
              </div>
              <Button
                type="submit"
                size="lg"
                isLoading={isSubmitting}
                className="w-full sm:w-auto bg-primary text-primary-foreground shadow-soft hover:bg-primary-hover hover:shadow-lifted"
              >
                {t('form.send_button', 'Send Message')}
              </Button>
            </form>
          </div>

          {/* Contact Info & Map */}
          <div
            className="space-y-12 lg:col-span-2 animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            <div>
              <h2 className="font-serif text-3xl font-bold tracking-tight">
                {t('info.title', 'Contact Information')}
              </h2>
              <div className="mt-8 space-y-6">
                {contactInfo.map((item) => (
                  <ContactInfoItem
                    key={item.titleKey}
                    icon={item.icon}
                    titleKey={item.titleKey} 
                    value={item.value}
                    href={item.href}
                  />
                ))}
              </div>
            </div>
            {/* Map */}
            <div>
              <h3 className="font-serif text-2xl font-bold tracking-tight mb-4">
                {t('info.map_title', 'Our Office')}
              </h3>
              <div className="overflow-hidden rounded-elegant shadow-soft border border-neutral-200">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.792518491378!2d36.78253081534403!3d-1.300583636056342!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f1a6bfce7fcc9%3A0x11e15194489a5611!2sNgong%20Road!5e0!3m2!1sen!2ske"
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Shamba Sure Office Location"
                ></iframe>
              </div>
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

// Define props with titleKey included
interface ContactInfoItemProps {
  icon: React.ElementType;
  titleKey: string;
  value: string;
  href?: string;
}

// Contact Info Item handles its own translation
function ContactInfoItem({ icon: Icon, titleKey, value, href }: ContactInfoItemProps) {
  const { t } = useTranslation(['contact']);

  const content = (
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-elegant bg-secondary/10">
        <Icon className="h-6 w-6 text-secondary" />
      </div>
      <div>
        <h3 className="font-serif text-lg font-bold text-text">{t(titleKey)}</h3>
        <p className="text-text-subtle">{value}</p>
      </div>
    </div>
  );

  return href ? (
    <a
      href={href}
      className="group block rounded-elegant p-2 -ml-2 transition-colors duration-300 hover:bg-background-subtle"
    >
      {content}
    </a>
  ) : (
    <div className="p-2">{content}</div>
  );
}
