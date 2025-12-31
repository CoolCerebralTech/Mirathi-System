import React from 'react';
import { Button } from '@/components/ui';
import { WillStatusBadge } from './WillStatusBadge';
import { WillTypeBadge } from './WillTypeBadge';
import { WillStatus, WillType } from '@/types/will.types';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';

interface WillHeaderProps {
  title: string;
  status: WillStatus;
  type: WillType;
  lastUpdated?: string;
  showBack?: boolean;
  actions?: React.ReactNode; // For primary action buttons (e.g., "Edit")
  onBack?: () => void;
  className?: string;
}

export const WillHeader: React.FC<WillHeaderProps> = ({
  title,
  status,
  type,
  lastUpdated,
  showBack = false,
  actions,
  onBack,
  className
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={`flex flex-col gap-4 border-b bg-white pb-6 pt-2 ${className}`}>
      {/* Top Row: Back link & Meta */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {showBack && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 -ml-2 mr-1" 
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <span>Estate Planning</span>
          <span className="text-slate-300">/</span>
          <span>Wills</span>
        </div>
        
        {lastUpdated && (
          <div className="text-xs text-muted-foreground">
            Last saved: {new Date(lastUpdated).toLocaleDateString()} at {new Date(lastUpdated).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Bottom Row: Title, Badges, Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
            <WillStatusBadge status={status} />
          </div>
          <div className="flex items-center gap-2">
            <WillTypeBadge type={type} />
            <span className="text-sm text-muted-foreground">
              Reference: #{Math.random().toString(36).substr(2, 6).toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {actions}
          
          {/* Fallback Menu for generic actions if needed */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Manage Will</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>View History</DropdownMenuItem>
              <DropdownMenuItem>Download PDF</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">Delete Draft</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};