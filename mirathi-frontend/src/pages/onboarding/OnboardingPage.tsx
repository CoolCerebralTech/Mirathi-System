import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserIntentSelector, type UserIntent } from '@/features/onboarding/components/UserIntentSelector';
import { LogOut, HelpCircle, AlertCircle } from 'lucide-react';
import { Button, Alert, AlertDescription, Skeleton } from '@/components/ui';
// Using the correct User API hook as seen in Estate pages
import { useCurrentUser } from '@/features/user/user.api';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: currentUser, isLoading } = useCurrentUser();

  // Mock logout function since it wasn't provided in source, 
  // replace with actual auth hook if available e.g. useAuth()
  const handleLogout = () => {
    // Perform logout logic here
    navigate('/login');
  };

  const handleSelection = (intent: UserIntent) => {
    if (intent === 'PLANNING') {
      // Route A: Living -> Goes to Will Planning
      // We navigate to the specific Will page defined in your EstateWillPage
      navigate('/dashboard/estate/will'); 
    } else {
      // Route B: Deceased -> Goes to Estate Dashboard
      // This will trigger the CreateEstateDialog in EstateDashboardPage if no estate exists
      navigate('/dashboard/estate'); 
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
         <Skeleton className="h-96 w-full max-w-4xl" />
      </div>
    );
  }

  if (!currentUser) {
    return (
        <div className="container mx-auto p-6">
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>User session not found. Please log in.</AlertDescription>
        </Alert>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">
      
      {/* 1. Header */}
      <header className="px-6 py-4 flex justify-between items-center bg-white border-b border-neutral-200">
        <div className="flex items-center gap-2">
          {/* Replace with your actual Logo component */}
          <div className="font-serif font-bold text-xl text-[#0F3D3E]">MIRATHI</div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="hidden sm:flex text-muted-foreground">
            <HelpCircle className="mr-2 h-4 w-4" /> Support
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="text-[#0F3D3E] hover:bg-neutral-100"
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
      </header>

      {/* 2. Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 animate-in fade-in duration-700">
        
        <div className="text-center mb-12 max-w-2xl">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-[#C8A165] uppercase bg-[#C8A165]/10 rounded-full">
            The Golden Question
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-[#0F3D3E] mb-6 font-serif tracking-tight">
            How can Mirathi serve you today?
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Welcome, {currentUser.firstName || 'User'}. Our platform is specialized for two distinct legal journeys. 
            Please select the path that matches your current needs.
          </p>
        </div>

        {/* 3. Selector */}
        <div className="w-full">
          <UserIntentSelector onSelect={handleSelection} />
        </div>
        
      </main>
      
    </div>
  );
};