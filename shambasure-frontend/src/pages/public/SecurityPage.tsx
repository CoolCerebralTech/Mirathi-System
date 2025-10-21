// FILE: src/pages/public/SecurityPage.tsx

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, ShieldCheck, DatabaseZap, FileLock2, LifeBuoy, Fingerprint } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../components/ui/Accordion';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// TYPE DEFINITIONS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

interface SecurityFeatureProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export function SecurityPage() {
  const { t } = useTranslation(['security']); // Assuming you have a 'security.json' for translations

  const securityFeatures = React.useMemo(() => [
    { icon: Lock, titleKey: 'features.encryption.title', descriptionKey: 'features.encryption.description' },
    { icon: DatabaseZap, titleKey: 'features.infrastructure.title', descriptionKey: 'features.infrastructure.description' },
    { icon: Fingerprint, titleKey: 'features.access_control.title', descriptionKey: 'features.access_control.description' },
    { icon: FileLock2, titleKey: 'features.data_privacy.title', descriptionKey: 'features.data_privacy.description' },
    { icon: ShieldCheck, titleKey: 'features.audits.title', descriptionKey: 'features.audits.description' },
    { icon: LifeBuoy, titleKey: 'features.support.title', descriptionKey: 'features.support.description' },
  ], []);
  
  const faqs = React.useMemo(() => [
      { qKey: 'faq.q1', aKey: 'faq.a1' },
      { qKey: 'faq.q2', aKey: 'faq.a2' },
      { qKey: 'faq.q3', aKey: 'faq.a3' },
      { qKey: 'faq.q4', aKey: 'faq.a4' },
  ], []);

  return (
    <div className="bg-background font-sans text-text">
      {/* --- Hero Section --- */}
      <section className="border-b border-background-subtle bg-background-subtle/50">
        <div className="container max-w-5xl py-24 text-center sm:py-32">
          <h1 className="text-4xl font-bold font-serif tracking-tight sm:text-5xl lg:text-6xl">
            Your Security is Our Foundation
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-text-subtle">
            We are built with bank-grade security and an unwavering commitment to your privacy. Your family's legacy is protected at every level.
          </p>
        </div>
      </section>

      {/* --- Security Features Section --- */}
      <section className="py-20 lg:py-28">
        <div className="container max-w-6xl">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
            {securityFeatures.map((feature) => (
              <SecurityFeatureCard
                key={feature.titleKey}
                icon={feature.icon}
                title={t(feature.titleKey)}
                description={t(feature.descriptionKey)}
              />
            ))}
          </div>
        </div>
      </section>
      
      {/* --- FAQ Section --- */}
      <section className="py-20 lg:py-28 bg-background-subtle border-y border-neutral-light">
        <div className="container max-w-4xl">
             <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-serif font-bold tracking-tight">Frequently Asked Questions</h2>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-text-subtle">
                  Transparency is key to trust. Here are answers to common security questions.
                </p>
             </div>
             <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index + 1}`}>
                        <AccordionTrigger className="text-lg font-semibold text-left">{t(faq.qKey)}</AccordionTrigger>
                        <AccordionContent className="text-base text-text-subtle">
                            {t(faq.aKey)}
                        </AccordionContent>
                    </AccordionItem>
                ))}
             </Accordion>
        </div>
      </section>
    </div>
  );
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// CHILD COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function SecurityFeatureCard({ icon: Icon, title, description }: SecurityFeatureProps) {
  return (
    <div className="flex flex-col text-left">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10 mb-5">
        <Icon className="h-6 w-6 text-secondary" />
      </div>
      <h3 className="text-xl font-serif font-bold mb-2">{title}</h3>
      <p className="text-text-subtle">{description}</p>
    </div>
  );
}
