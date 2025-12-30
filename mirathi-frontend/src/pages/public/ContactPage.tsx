// FILE: src/pages/public/ContactPage.tsx
// VERSION 2: Old Money Refined - Premium Lead Capture

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, Clock, MessageCircle, Shield, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Label } from '../../components/ui/Label';
import { Badge } from '../../components/ui/Badge';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// FORM SCHEMA
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const ContactFormSchema = z.object({
  firstName: z.string().min(1, { message: 'validation.first_name_required' }),
  lastName: z.string().min(1, { message: 'validation.last_name_required' }),
  email: z.string().email({ message: 'validation.invalid_email' }),
  phone: z.string().optional(),
  subject: z.string().min(1, { message: 'validation.subject_required' }),
  message: z.string().min(10, { message: 'validation.message_too_short' }),
});

type ContactFormInput = z.infer<typeof ContactFormSchema>;

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// MAIN COMPONENT
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
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log('Contact Form Submitted:', data);
    toast.success(t('toasts.submit_success_title', 'Message Received!'), {
      description: t('toasts.submit_success_description', 'We\'ll respond within 24 hours.'),
    });
    reset();
  };

  const contactInfo: ContactInfoItemProps[] = [
    {
      icon: Mail,
      titleKey: 'info.email_title',
      descriptionKey: 'info.email_description',
      value: 'support@shambasure.com',
      href: 'mailto:support@shambasure.com',
    },
    {
      icon: Phone,
      titleKey: 'info.phone_title',
      descriptionKey: 'info.phone_description',
      value: '+254 712 345 678',
      href: 'tel:+254712345678',
    },
    {
      icon: MapPin,
      titleKey: 'info.address_title',
      descriptionKey: 'info.address_description',
      value: 'Ngong Road, Nairobi',
      secondaryValue: 'Kenya',
    },
    {
      icon: Clock,
      titleKey: 'info.hours_title',
      descriptionKey: 'info.hours_description',
      value: 'Mon-Fri: 8AM - 6PM',
      secondaryValue: 'Sat: 9AM - 2PM',
    },
  ];

  const supportOptions = [
    { 
      icon: MessageCircle, 
      titleKey: 'support.general.title', 
      descriptionKey: 'support.general.description' 
    },
    { 
      icon: Shield, 
      titleKey: 'support.security.title', 
      descriptionKey: 'support.security.description' 
    },
  ];

  const responsePromises = [
    'promises.response_24h',
    'promises.direct_team',
    'promises.no_sales_pressure',
  ];

  return (
    <div className="bg-background font-sans text-text">
      
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* HERO SECTION */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="relative overflow-hidden border-b border-neutral-200 bg-gradient-to-br from-background via-background-subtle to-primary/5">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(184, 134, 11) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="container relative max-w-5xl py-20 text-center sm:py-28">
          <Badge className="mb-6 border-primary/30 bg-primary/10 px-4 py-1.5 font-serif text-sm font-medium text-primary shadow-soft">
            {t('hero.badge', 'We\'re Here to Help')}
          </Badge>
          
          <h1 className="font-display text-5xl font-bold tracking-tight text-text sm:text-6xl lg:text-7xl">
            {t('hero.title', 'Let\'s Start a')}
            <span className="mt-2 block text-primary">
              {t('hero.title_accent', 'Conversation')}
            </span>
          </h1>
          
          <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-text-subtle sm:text-xl">
            {t('hero.subtitle', 'Have questions about protecting your family\'s land legacy? Our team is ready to provide personalized guidance and support.')}
          </p>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-sm text-text-subtle">{t('hero.trust.response', '24-hour response time')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-sm text-text-subtle">{t('hero.trust.expert', 'Expert guidance')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-sm text-text-subtle">{t('hero.trust.no_pressure', 'No sales pressure')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* MAIN CONTENT - FORM + INFO */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="py-20 lg:py-32">
        <div className="container grid max-w-7xl gap-16 lg:grid-cols-5">
          
          {/* LEFT: CONTACT FORM (3 columns) */}
          <div className="space-y-8 lg:col-span-3">
            <div>
              <p className="mb-4 font-serif text-sm font-semibold uppercase tracking-elegant text-primary">
                {t('form.eyebrow', 'Get in Touch')}
              </p>
              <h2 className="font-display text-4xl font-bold tracking-tight text-text">
                {t('form.title', 'Send Us a Message')}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-text-subtle">
                {t('form.description', 'Fill out the form below and we\'ll get back to you within 24 hours.')}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name Fields */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="font-serif text-sm font-semibold text-text">
                    {t('form.first_name', 'First Name')} <span className="text-danger">*</span>
                  </Label>
                  <Input 
                    id="firstName" 
                    disabled={isSubmitting} 
                    {...register('firstName')}
                    className="border-neutral-300 bg-background transition-all duration-300 focus:border-primary focus:ring-primary"
                  />
                  {errors.firstName?.message && (
                    <p className="text-sm text-danger">{t(errors.firstName.message)}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="font-serif text-sm font-semibold text-text">
                    {t('form.last_name', 'Last Name')} <span className="text-danger">*</span>
                  </Label>
                  <Input 
                    id="lastName" 
                    disabled={isSubmitting} 
                    {...register('lastName')}
                    className="border-neutral-300 bg-background transition-all duration-300 focus:border-primary focus:ring-primary"
                  />
                  {errors.lastName?.message && (
                    <p className="text-sm text-danger">{t(errors.lastName.message)}</p>
                  )}
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-serif text-sm font-semibold text-text">
                    {t('form.email', 'Email Address')} <span className="text-danger">*</span>
                  </Label>
                  <Input 
                    id="email" 
                    type="email" 
                    disabled={isSubmitting} 
                    {...register('email')}
                    className="border-neutral-300 bg-background transition-all duration-300 focus:border-primary focus:ring-primary"
                  />
                  {errors.email?.message && (
                    <p className="text-sm text-danger">{t(errors.email.message)}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-serif text-sm font-semibold text-text">
                    {t('form.phone', 'Phone Number')} <span className="text-text-muted">(Optional)</span>
                  </Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    disabled={isSubmitting} 
                    {...register('phone')}
                    placeholder="+254 712 345 678"
                    className="border-neutral-300 bg-background transition-all duration-300 focus:border-primary focus:ring-primary"
                  />
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject" className="font-serif text-sm font-semibold text-text">
                  {t('form.subject', 'Subject')} <span className="text-danger">*</span>
                </Label>
                <Input 
                  id="subject" 
                  disabled={isSubmitting} 
                  {...register('subject')}
                  placeholder={t('form.subject_placeholder', 'e.g., Question about digital wills')}
                  className="border-neutral-300 bg-background transition-all duration-300 focus:border-primary focus:ring-primary"
                />
                {errors.subject?.message && (
                  <p className="text-sm text-danger">{t(errors.subject.message)}</p>
                )}
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message" className="font-serif text-sm font-semibold text-text">
                  {t('form.message', 'Message')} <span className="text-danger">*</span>
                </Label>
                <Textarea 
                  id="message" 
                  rows={6} 
                  disabled={isSubmitting} 
                  {...register('message')}
                  placeholder={t('form.message_placeholder', 'Tell us how we can help you...')}
                  className="border-neutral-300 bg-background transition-all duration-300 focus:border-primary focus:ring-primary"
                />
                {errors.message?.message && (
                  <p className="text-sm text-danger">{t(errors.message.message)}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex items-center gap-4">
                <Button
                  type="submit"
                  size="lg"
                  isLoading={isSubmitting}
                  className="bg-primary text-lg font-semibold text-primary-foreground shadow-soft transition-all duration-300 hover:bg-primary-hover hover:shadow-lifted"
                >
                  {t('form.send_button', 'Send Message')}
                </Button>
                <p className="text-sm text-text-muted">
                  {t('form.response_time', 'We typically respond within 24 hours')}
                </p>
              </div>
            </form>

            {/* Our Promises */}
            <div className="rounded-elegant border border-primary/20 bg-primary/5 p-6">
              <h3 className="mb-4 font-serif text-lg font-bold text-text">
                {t('promises.title', 'Our Commitment to You')}
              </h3>
              <ul className="space-y-3">
                {responsePromises.map((promiseKey) => (
                  <li key={promiseKey} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-sm text-text-subtle">{t(promiseKey)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* RIGHT: CONTACT INFO + SUPPORT (2 columns) */}
          <div className="space-y-8 lg:col-span-2">
            
            {/* Contact Information */}
            <div className="rounded-elegant border border-neutral-200 bg-background p-8 shadow-soft">
              <h3 className="mb-6 font-serif text-2xl font-bold text-text">
                {t('info.title', 'Contact Information')}
              </h3>
              <div className="space-y-6">
                {contactInfo.map((item) => (
                  <ContactInfoItem
                    key={item.titleKey}
                    icon={item.icon}
                    titleKey={item.titleKey}
                    descriptionKey={item.descriptionKey}
                    value={item.value}
                    secondaryValue={item.secondaryValue}
                    href={item.href}
                  />
                ))}
              </div>
            </div>

            {/* Support Options */}
            <div className="rounded-elegant border border-neutral-200 bg-background p-8 shadow-soft">
              <h3 className="mb-6 font-serif text-2xl font-bold text-text">
                {t('support.title', 'Support Channels')}
              </h3>
              <div className="space-y-4">
                {supportOptions.map((option) => (
                  <div 
                    key={option.titleKey}
                    className="rounded-elegant border border-neutral-200 bg-background-subtle p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-soft"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <option.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-serif text-base font-bold text-text">
                          {t(option.titleKey)}
                        </h4>
                        <p className="mt-1 text-sm text-text-subtle">
                          {t(option.descriptionKey)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map */}
            <div>
              <h3 className="mb-4 font-serif text-2xl font-bold text-text">
                {t('info.map_title', 'Our Office')}
              </h3>
              <div className="overflow-hidden rounded-elegant border border-neutral-200 shadow-soft">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.792518491378!2d36.78253081534403!3d-1.300583636056342!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f1a6bfce7fcc9%3A0x11e15194489a5611!2sNgong%20Road!5e0!3m2!1sen!2ske"
                  width="100%"
                  height="250"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Shamba Sure Office Location"
                  className="grayscale transition-all duration-500 hover:grayscale-0"
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
// CONTACT INFO ITEM COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

interface ContactInfoItemProps {
  icon: React.ElementType;
  titleKey: string;
  descriptionKey?: string;
  value: string;
  secondaryValue?: string;
  href?: string;
}

function ContactInfoItem({ 
  icon: Icon, 
  titleKey, 
  descriptionKey,
  value, 
  secondaryValue,
  href 
}: ContactInfoItemProps) {
  const { t } = useTranslation(['contact']);

  const content = (
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-secondary/10">
        <Icon className="h-6 w-6 text-secondary" />
      </div>
      <div className="flex-1">
        <h4 className="font-serif text-base font-bold text-text">{t(titleKey)}</h4>
        {descriptionKey && (
          <p className="mt-0.5 text-xs text-text-muted">{t(descriptionKey)}</p>
        )}
        <p className="mt-1 text-sm font-medium text-text-subtle">{value}</p>
        {secondaryValue && (
          <p className="text-sm text-text-subtle">{secondaryValue}</p>
        )}
      </div>
    </div>
  );

  return href ? (
    <a
      href={href}
      className="block rounded-elegant p-2 -m-2 transition-all duration-300 hover:bg-background-subtle"
    >
      {content}
    </a>
  ) : (
    <div>{content}</div>
  );
}
