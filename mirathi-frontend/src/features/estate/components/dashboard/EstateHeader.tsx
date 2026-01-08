// ============================================================================
// FILE: EstateHeader.tsx
// ============================================================================

import React from 'react';
import { Shield, Calendar, FileText } from 'lucide-react';
import { Badge } from '@/components/ui';
import type { EstateSummaryResponse } from '@/types/estate.types';

interface EstateHeaderProps {
  summary: EstateSummaryResponse;
}

export const EstateHeader: React.FC<EstateHeaderProps> = ({ summary }) => {
  // Destructure the nested objects for easier access
  const { overview, timestamps } = summary;

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="border-b bg-gradient-to-r from-blue-50 to-purple-50 py-6 px-6 rounded-t-lg">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left Section: Estate Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {overview.userName}'s Estate
              </h1>
              <p className="text-sm text-muted-foreground">
                Digital Succession Planning • Mirathi System
              </p>
            </div>
          </div>

          {/* KRA PIN if available */}
          {overview.kraPin && (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">KRA PIN:</span>
              <span className="font-mono font-medium">{overview.kraPin}</span>
            </div>
          )}
        </div>

        {/* Right Section: Badges and Date */}
        <div className="flex flex-col items-start md:items-end gap-2">
          {/* Solvency Badge */}
          {overview.isInsolvent ? (
            <Badge variant="destructive" className="text-sm">
              ⚠️ Insolvent Estate
            </Badge>
          ) : (
            <Badge className="bg-green-600 hover:bg-green-700 text-sm">
              ✓ Solvent Estate
            </Badge>
          )}

          {/* Created Date */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Created {formatDate(timestamps.createdAt)}</span>
          </div>

          {/* Estate ID */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Estate ID:</span>
            {/* Safe check just in case, though overview.id should exist */}
            <span className="font-mono">{overview.id?.slice(0, 8)}...</span>
          </div>
        </div>
      </div>
    </div>
  );
};