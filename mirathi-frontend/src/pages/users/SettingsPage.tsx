// FILE: src/pages/dashboard/SettingsPage.tsx

import React from 'react';
import { Shield, Bell, KeyRound, AlertTriangle, Lock } from 'lucide-react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger,
  Alert,
  AlertDescription,
} from '@/components/ui';

// Feature components (Self-contained cards)
import { ChangePasswordForm } from '@/features/user/forms/ChangePasswordForm';
import { MarketingPreferencesForm } from '@/features/user/forms/MarketingPreferencesForm';
import { DeactivateAccountForm } from '@/features/user/forms/DeactivateAccountForm';

export const SettingsPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-[#0F3D3E] font-serif tracking-tight">System Configuration</h1>
        <p className="text-slate-500 mt-2 text-lg">
          Manage security protocols, notifications, and account access.
        </p>
      </div>

      <Tabs defaultValue="security" className="w-full space-y-8">
        
        {/* Navigation Tabs - Styled like folder tabs */}
        <TabsList className="w-full justify-start h-auto p-1 bg-slate-100/50 rounded-lg border border-slate-200 space-x-1">
          <TabsTrigger 
            value="security" 
            className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:text-[#0F3D3E] data-[state=active]:shadow-sm transition-all"
          >
            <Shield className="h-4 w-4" /> Security
          </TabsTrigger>
          <TabsTrigger 
            value="notifications"
            className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:text-[#0F3D3E] data-[state=active]:shadow-sm transition-all"
          >
            <Bell className="h-4 w-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger 
            value="danger"
            className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-sm transition-all text-slate-500 hover:text-red-600"
          >
            <AlertTriangle className="h-4 w-4" /> Advanced
          </TabsTrigger>
        </TabsList>

        {/* === TAB 1: SECURITY === */}
        <TabsContent value="security" className="space-y-8 focus:outline-none">
          
          {/* Section: Password */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 px-1">
              <KeyRound className="h-5 w-5 text-[#C8A165]" /> Credentials
            </h2>
            <ChangePasswordForm />
          </div>

          {/* Section: 2FA (Static Info for now) */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 px-1">
              <Lock className="h-5 w-5 text-emerald-600" /> Multi-Factor Authentication
            </h2>
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-emerald-50 rounded-lg">
                   <Shield className="h-6 w-6 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Standard Protection Active</h3>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                    Your account is protected by industry-standard encryption and session monitoring. 
                    Sensitive actions require re-authentication.
                  </p>
                  
                  <Alert className="mt-4 bg-slate-50 border-slate-200">
                    <AlertDescription className="text-slate-600 text-xs flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      System Status: <span className="font-semibold text-emerald-700">Secure</span>
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* === TAB 2: NOTIFICATIONS === */}
        <TabsContent value="notifications" className="space-y-6 focus:outline-none">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 px-1">
              <Bell className="h-5 w-5 text-[#C8A165]" /> Alert Preferences
            </h2>
            <MarketingPreferencesForm />
          </div>
        </TabsContent>

        {/* === TAB 3: DANGER ZONE === */}
        <TabsContent value="danger" className="space-y-6 focus:outline-none">
          <div className="space-y-4">
             <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div className="ml-2">
                <p className="font-bold text-sm">Caution Advised</p>
                <AlertDescription className="text-red-800/80 text-xs mt-0.5">
                  Actions in this area affect your data integrity and cannot be undone by support staff.
                </AlertDescription>
              </div>
            </Alert>
            
            <DeactivateAccountForm />
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
};