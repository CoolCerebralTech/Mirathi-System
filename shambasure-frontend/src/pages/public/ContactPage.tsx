// FILE: src/pages/public/ContactPage.tsx (New & Finalized)

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Label } from '../../components/ui/Label';

export function ContactPage() {
  const { t } = useTranslation('public');

  return (
    <div>
      <section className="py-20 text-center bg-primary/5">
        <div className="container">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">{t('contact:hero_title', 'Get in Touch')}</h1>
          <p className="mt-6 text-xl text-muted-foreground">{t('contact:hero_subtitle', 'We’re here to help. Ask us anything or share your feedback.')}</p>
        </div>
      </section>

      <section className="py-20">
        <div className="container grid gap-12 lg:grid-cols-2">
          {/* Contact Form */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">{t('contact:form_title', 'Send Us a Message')}</h2>
            <form className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1"><Label htmlFor="firstName">{t('contact:first_name')}</Label><Input id="firstName" /></div>
                <div className="space-y-1"><Label htmlFor="lastName">{t('contact:last_name')}</Label><Input id="lastName" /></div>
              </div>
              <div className="space-y-1"><Label htmlFor="email">{t('contact:email')}</Label><Input id="email" type="email" /></div>
              <div className="space-y-1"><Label htmlFor="message">{t('contact:message')}</Label><Textarea id="message" rows={5} /></div>
              <Button type="submit" size="lg">{t('contact:send_message')}</Button>
            </form>
          </div>
          
          {/* Contact Info */}
          <div className="space-y-8">
            <h2 className="text-3xl font-bold">{t('contact:info_title', 'Contact Information')}</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <Mail className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">{t('contact:email')}</h3>
                  <a href="mailto:support@shambasure.com" className="text-muted-foreground hover:text-primary">support@shambasure.com</a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Phone className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">{t('contact:phone')}</h3>
                  <p className="text-muted-foreground">+254 712 345 678</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MapPin className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">{t('contact:address')}</h3>
                  <p className="text-muted-foreground">123 Ngong Road, Nairobi, Kenya</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}