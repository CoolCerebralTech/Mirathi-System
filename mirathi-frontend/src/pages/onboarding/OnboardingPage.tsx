// FILE: src/pages/onboarding/OnboardingPage.tsx
// CONTEXT: The "Golden Question" Page

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserIntentSelector, type UserIntent } from '@/features/onboarding/components/UserIntentSelector';
import { LogOut, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useLogout } from '@/features/auth/auth.api';
import { Logo } from '@/components/common/Logo'; // Ensuring we use the brand logo

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { mutate: logout } = useLogout();

  // The Routing Logic
  const handleSelection = (intent: UserIntent) => {
    if (intent === 'PLANNING') {
      // Route A: Living -> Wills Module
      navigate('/dashboard/wills'); 
    } else {
      // Route B: Deceased -> Estate Intake Wizard
      navigate('/dashboard/estates/new'); 
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">
      
      {/* 1. Minimalist Header */}
      <header className="px-6 py-4 flex justify-between items-center bg-white border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-auto text-[#0F3D3E]" />
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="hidden sm:flex text-neutral-500">
            <HelpCircle className="mr-2 h-4 w-4" /> Support
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => logout()}
            className="text-[#0F3D3E] hover:bg-neutral-100"
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
      </header>

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 animate-in fade-in duration-700">
        
        <div className="text-center mb-12 max-w-2xl">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-[#C8A165] uppercase bg-[#C8A165]/10 rounded-full">
            The Golden Question
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-[#0F3D3E] mb-6 font-serif tracking-tight">
            How can Mirathi serve you today?
          </h1>
          <p className="text-lg text-neutral-600 leading-relaxed">
            Our platform is specialized for two distinct legal journeys. 
            Please select the path that matches your current needs.
          </p>
        </div>

        {/* 3. The Selector */}
        <div className="w-full">
          <UserIntentSelector onSelect={handleSelection} />
        </div>
        
        {/* 4. Footer Note */}
        <p className="mt-12 text-sm text-neutral-400 text-center">
          Not sure? You can add other services from your dashboard later.
        </p>

      </main>
      
    </div>
  );
};