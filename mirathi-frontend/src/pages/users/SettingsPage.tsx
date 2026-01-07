import React from 'react';
import { Shield, Bell, KeyRound, AlertTriangle } from 'lucide-react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Alert,
  AlertTitle,
  AlertDescription
} from '@/components/ui';

// Feature components
import { ChangePasswordForm } from '@/features/user/components/ChangePasswordForm';
import { MarketingPreferencesForm } from '@/features/user/components/MarketingPreferencesForm';
import { DeactivateAccountForm } from '@/features/user/components/DeactivateAccountForm';

export const SettingsPage: React.FC = () => {
  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-500">
      
      <div>
        <h1 className="text-3xl font-bold text-[#0F3D3E]">System Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your password, notifications, and account security.
        </p>
      </div>

      <Tabs defaultValue="security" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="danger">Advanced</TabsTrigger>
        </TabsList>

        {/* === TAB 1: SECURITY === */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-[#C8A165]" />
                Password Management
              </CardTitle>
              <CardDescription>
                Ensure your account is using a long, random password to stay secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-600" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your estate data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder for 2FA logic if you implement it later */}
              <Alert className="bg-slate-50 border-slate-200">
                <AlertDescription className="text-slate-600 text-sm">
                  Two-factor authentication via Authenticator App is currently 
                  <span className="font-semibold text-emerald-700 ml-1">Enabled by System Policy</span>.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === TAB 2: NOTIFICATIONS === */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-[#C8A165]" />
                Communication Preferences
              </CardTitle>
              <CardDescription>
                Choose how Mirathi communicates with you regarding legal updates and marketing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MarketingPreferencesForm />
            </CardContent>
          </Card>
        </TabsContent>

        {/* === TAB 3: DANGER ZONE === */}
        <TabsContent value="danger">
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Proceed with caution. Actions in this section can result in permanent data loss.
            </AlertDescription>
          </Alert>

          <Card className="border-red-100">
            <CardHeader>
              <CardTitle className="text-red-900">Account Termination</CardTitle>
              <CardDescription className="text-red-700/80">
                Permanently delete your account and all associated estate records.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeactivateAccountForm />
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};