// FILE: src/pages/public/SolutionsPage.tsx
// CONTEXT: Segmenting the audience (Executors vs Heirs)

import { Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export function SolutionsPage() {
  const navigate = useNavigate();

  const tiers = [
    {
      name: 'For Executors & Administrators',
      id: 'executors',
      description: 'You have been appointed to manage an estate. We give you the tools to do it legally and efficiently.',
      features: [
        'Automated Asset Inventory',
        'Liability & Solvency Check (S.45)',
        'Heir Verification Tools',
        'Generate Petition Forms (P&A 80)',
        'Expense Tracking & Audit Trail'
      ],
      cta: 'Start as Executor',
      mostPopular: true,
    },
    {
      name: 'For Families & Heirs',
      id: 'families',
      description: 'Ensure you are treated fairly. Track the process and understand your rights under the Law of Succession.',
      features: [
        'View Estate Progress',
        'Digital Consent Signing',
        'Understand Your Share (S.35/38)',
        'Request Updates from Executor',
        'Secure Identity Storage'
      ],
      cta: 'Join as Beneficiary',
      mostPopular: false,
    },
  ];

  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-[#C8A165]">Tailored Solutions</h2>
          <p className="mt-2 font-serif text-4xl font-bold tracking-tight text-[#0F3D3E] sm:text-5xl">
            Who are you in this journey?
          </p>
          <p className="mt-6 text-lg leading-8 text-neutral-600">
            Whether you are leading the process or a beneficiary waiting for distribution, Mirathi protects your interests.
          </p>
        </div>
        
        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:gap-x-8 xl:gap-x-12">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-3xl p-8 ring-1 xl:p-10 ${
                tier.mostPopular
                  ? 'bg-[#0F3D3E] ring-[#0F3D3E] text-white shadow-2xl scale-105 z-10'
                  : 'bg-white ring-neutral-200 text-neutral-900'
              }`}
            >
              <div className="flex items-center justify-between gap-x-4">
                <h3 id={tier.id} className="text-lg font-bold leading-8 font-serif">
                  {tier.name}
                </h3>
              </div>
              <p className={`mt-4 text-sm leading-6 ${tier.mostPopular ? 'text-neutral-300' : 'text-neutral-600'}`}>
                {tier.description}
              </p>
              <ul role="list" className={`mt-8 space-y-3 text-sm leading-6 ${tier.mostPopular ? 'text-neutral-300' : 'text-neutral-600'}`}>
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <Check className={`h-6 w-5 flex-none ${tier.mostPopular ? 'text-[#C8A165]' : 'text-[#0F3D3E]'}`} aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => navigate('/register')}
                className={`mt-8 w-full ${
                  tier.mostPopular 
                    ? 'bg-[#C8A165] text-[#0F3D3E] hover:bg-[#C8A165]/90' 
                    : 'bg-neutral-100 text-[#0F3D3E] hover:bg-neutral-200'
                }`}
              >
                {tier.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}