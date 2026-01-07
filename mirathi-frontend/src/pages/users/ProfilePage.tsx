// ProfilePage.tsx - Updated version
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Mail, Calendar, Shield, User, CheckCircle, AlertCircle } from 'lucide-react';
import { useCurrentUser } from '@/features/user/user.api';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  Separator,
  Alert,
  AlertTitle,
  AlertDescription,
  Skeleton,
  Badge
} from '@/components/ui';
import { ProfileForm } from '@/features/user/components/ProfileForm';
import { Avatar, AvatarFallback, PageHeader } from '@/components/common';

export const ProfilePage: React.FC = () => {
  const { t } = useTranslation(['user']);
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-8">
        <PageHeader
          title={t('profile_page_title', 'My Profile')}
          description={t('profile_page_description', 'View and manage your personal details.')}
        />
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <PageHeader
        title={t('profile_page_title', 'My Profile')}
        description={t('profile_page_description', 'View and manage your personal details.')}
      />

      {/* Alert about Settings */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>{t('settings_link_title', 'Looking for account settings?')}</AlertTitle>
        <AlertDescription>
          {t('settings_link_description', 'To change your name, password, or manage marketing preferences, please visit the')}{' '}
          <Link to="/settings" className="font-semibold text-primary hover:underline">
            {t('settings_page_title', 'Account Settings')}
          </Link>.
        </AlertDescription>
      </Alert>

      {/* 1. PROFILE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <Avatar className="h-24 w-24 border-4 border-slate-50">
          <AvatarFallback className="bg-[#0F3D3E] text-white text-2xl font-serif">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">
            {user?.firstName} {user?.lastName}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {user?.email}
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Joined {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        
        {/* 2. LEFT COLUMN: PROFILE FORM */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-[#C8A165]" />
                Personal & Contact Information
              </CardTitle>
              <CardDescription>
                Keep your personal and contact details up-to-date for better service delivery.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm /> 
            </CardContent>
          </Card>
        </div>

        {/* 3. RIGHT COLUMN: ACCOUNT DETAILS */}
        <div className="space-y-6">
          {/* Email Verification Status */}
          <Card className="bg-slate-50 border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-slate-500">
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-emerald-600" />
                  <span>Email</span>
                  {user?.emailVerified && (
                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                      Verified
                    </Badge>
                  )}
                </div>
                <span className={`font-medium ${user?.emailVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {user?.emailVerified ? 'Verified' : 'Not Verified'}
                </span>
              </div>
              <Separator />
              
              {/* Account Status */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span>Account</span>
                </div>
                <span className={`font-medium ${user?.isActive ? 'text-emerald-700' : 'text-red-700'}`}>
                  {user?.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <Separator />
              
              {/* Role */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-purple-600" />
                  <span>Role</span>
                </div>
                <span className="font-medium text-slate-700">
                  {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase() : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Last Login Information */}
          <Card className="bg-slate-50 border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-slate-500">
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>Last Login</span>
                </div>
                <span className="font-medium text-slate-700">
                  {user?.lastLoginAt 
                    ? new Date(user.lastLoginAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : 'Never'
                  }
                </span>
              </div>
              {user?.lastLoginAt && (
                <>
                  <Separator />
                  <div className="text-xs text-slate-500">
                    Last login at {new Date(user.lastLoginAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Account Lock Status (if applicable) */}
          {user?.isLocked && (
            <Card className="bg-amber-50 border-amber-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-amber-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Account Locked
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-700">
                  Your account is temporarily locked. Please contact support or wait until{' '}
                  {user?.lockedUntil 
                    ? new Date(user.lockedUntil).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'the lock expires'
                  }.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick Tips */}
          <Card className="bg-blue-50 border-blue-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-blue-700">
                Profile Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">
                  Keep your phone number updated for important notifications
                </span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">
                  Provide your complete address for better service delivery
                </span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">
                  Verify your email to access all platform features
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};