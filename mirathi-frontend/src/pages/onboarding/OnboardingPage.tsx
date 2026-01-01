// FILE: src/pages/onboarding/OnboardingPage.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserIntentSelector, type UserIntent } from '@/features/onboarding/components/UserIntentSelector';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui';
import { useLogout } from '@/features/auth/auth.api';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { mutate: logout } = useLogout();

  const handleSelection = (intent: UserIntent) => {
    if (intent === 'PLANNING') {
      // User wants to write a Will -> Redirect to Will Creation Flow
      navigate('/wills/dashboard'); // Or '/wills/new' depending on your pref
    } else {
      // User is an Executor -> Redirect to Estate Creation Flow
      navigate('/estates/new'); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* Simple Header */}
      <header className="px-6 py-4 flex justify-between items-center bg-white border-b">
        <div className="font-serif text-xl font-bold text-slate-900">Mirathi</div>
        <Button variant="ghost" size="sm" onClick={() => logout()}>
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="text-center mb-10 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 font-serif">
            How can we help you today?
          </h1>
          <p className="text-lg text-slate-500">
            We've tailored Mirathi to handle two very different legal processes. 
            Select the one that matches your current situation.
          </p>
        </div>

        <UserIntentSelector onSelect={handleSelection} />
      </main>
      
    </div>
  );
};