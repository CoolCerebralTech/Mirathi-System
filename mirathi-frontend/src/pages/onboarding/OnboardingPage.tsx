import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// API & Store
import { useCompleteOnboarding, useLogout } from '../../features/auth/auth.api';
import { useCurrentUser } from '../../store/auth.store';

// Components
import { UserIntentSelector, type UserIntent } from '../../features/onboarding/components/UserIntentSelector';
import { Button } from '../../components/ui/Button';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  useTranslation(['common', 'onboarding']);
  const user = useCurrentUser();
  
  // 1. Hooks for API actions
  const { mutate: logout } = useLogout();
  const { mutate: completeOnboarding, isPending } = useCompleteOnboarding();

  // 2. Logic: Activate Account -> Redirect based on choice
  const handleSelection = (intent: UserIntent) => {
    completeOnboarding(undefined, {
      onSuccess: () => {
        // Redirect logic matches your domain requirements
        if (intent === 'PLANNING') {
          // Future: /dashboard/wills
          navigate('/dashboard'); 
        } else {
          // Future: /dashboard/estates/new
          navigate('/dashboard/estates/new'); 
        }
      }
    });
  };

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => navigate('/login')
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-white">
      
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Sparkles className="h-4 w-4 text-slate-900" />
          </div>
          <span className="font-serif text-xl font-bold text-white tracking-tight">Mirathi</span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400 hidden sm:block">
            Logged in as <span className="text-white font-medium">{user?.profile?.firstName || 'User'}</span>
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-400 hover:bg-red-950/20"
          >
            <LogOut className="mr-2 h-4 w-4" /> 
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="text-center mb-12 max-w-2xl space-y-4">
          <h1 className="text-3xl md:text-5xl font-bold text-white font-serif leading-tight">
            How can we help you today?
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            We've tailored Mirathi to handle two very different legal processes. 
            Select the one that matches your current situation to activate your workspace.
          </p>
        </div>

        {/* 
           Note: Ensure UserIntentSelector accepts 'isLoading' prop 
           if you want to show a spinner during the mutation 
        */}
        <div className={isPending ? 'opacity-50 pointer-events-none' : ''}>
          <UserIntentSelector onSelect={handleSelection} />
        </div>
      </main>
      
    </div>
  );
};