// FILE: src/pages/dashboard/ProfilePage.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, 
  Calendar, 
  Shield, 
  User, 
  CheckCircle2, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { useCurrentUser } from '@/features/user/user.api';
import { 
  Separator,
  Skeleton
} from '@/components/ui';
import { ProfileForm } from '@/features/user/components/ProfileForm';
import { Avatar, AvatarFallback } from '@/components/common/Avatar';

export const ProfilePage: React.FC = () => {
  const { data: user, isLoading } = useCurrentUser();

  // Loading State
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();
  const joinedDate = new Date(user?.createdAt || Date.now()).toLocaleDateString('en-KE', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Header Section */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-[#0F3D3E] font-serif tracking-tight">
          My Profile
        </h1>
        <p className="text-slate-500 mt-2 text-lg">
          View and manage your personal details and contact information.
        </p>
      </div>

      {/* Identity Banner */}
      <div className="flex flex-col md:flex-row md:items-center gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <Avatar className="h-20 w-20 border-4 border-slate-50 ring-1 ring-slate-100">
          <AvatarFallback className="bg-[#0F3D3E] text-white text-xl font-bold font-serif">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        <div className="space-y-1 flex-1">
          <h2 className="text-2xl font-bold text-slate-900">
            {user?.firstName} {user?.lastName}
          </h2>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              {user?.email}
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              Member since {joinedDate}
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-emerald-700">Identity Verified</span>
            </div>
          </div>
        </div>

        <div className="hidden md:block">
           <Link 
             to="/dashboard/settings" 
             className="text-sm font-semibold text-[#0F3D3E] hover:underline flex items-center gap-1"
           >
             Account Settings <AlertCircle className="h-3.5 w-3.5" />
           </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        
        {/* LEFT COLUMN: Main Form */}
        <div className="lg:col-span-2 space-y-8">
          <ProfileForm /> 
        </div>

        {/* RIGHT COLUMN: Sidebar Info */}
        <div className="space-y-6">
          
          {/* Account Status Card */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50/50 px-4 py-3 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Account Status
              </h3>
            </div>
            <div className="p-4 space-y-4">
              
              {/* Role */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-blue-50 rounded-md text-blue-600">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Role</span>
                </div>
                <span className="text-sm font-bold text-slate-900 capitalize">
                  {user?.role ? user.role.toLowerCase().replace('_', ' ') : 'User'}
                </span>
              </div>

              <Separator className="bg-slate-100" />

              {/* Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-md ${user?.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    <Shield className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Status</span>
                </div>
                <span className={`text-sm font-bold ${user?.isActive ? 'text-emerald-700' : 'text-red-700'}`}>
                  {user?.isActive ? 'Active' : 'Restricted'}
                </span>
              </div>

              <Separator className="bg-slate-100" />

              {/* Last Login */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-slate-100 rounded-md text-slate-500">
                    <Clock className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Last Active</span>
                </div>
                <span className="text-xs font-medium text-slate-500">
                   {user?.lastLoginAt 
                    ? new Date(user.lastLoginAt).toLocaleDateString('en-GB')
                    : 'Never'
                  }
                </span>
              </div>

            </div>
          </div>

          {/* Quick Tips Card */}
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
            <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Profile Tips
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-xs text-blue-800 leading-relaxed">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                Ensure your phone number is correct to receive automated SMS alerts about your case.
              </li>
              <li className="flex items-start gap-2.5 text-xs text-blue-800 leading-relaxed">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                Your physical address determines which county registry handles your succession filing.
              </li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
};