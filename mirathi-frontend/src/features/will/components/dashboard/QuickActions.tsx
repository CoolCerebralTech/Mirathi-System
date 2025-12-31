import React from 'react';
import { Button } from '@/components/ui';
import { 
  PenTool, 
  UserCheck, 
  ShieldBan, 
  Trash2 
} from 'lucide-react';
import { WillStatus, WillType } from '@/types/will.types'; // Import necessary types

interface QuickActionsProps {
  willId: string;
  status: WillStatus;
  type: WillType;
  isRevoked: boolean;
  hasValidationErrors: boolean;
  onEdit?: () => void;
  onExecute?: () => void;
  onRevoke?: () => void;
  onDelete?: () => void;
  className?: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ 
  status, 
  isRevoked, 
  hasValidationErrors, 
  onEdit, 
  onExecute, 
  onRevoke, 
  onDelete,
  className 
}) => {
  const isDraft = status === 'DRAFT';
  const isExecuted = status === 'EXECUTED';

  // Determine button visibility based on status and state
  const showEdit = isDraft && !isRevoked && !isExecuted;
  const showExecute = isDraft && !isRevoked && !isExecuted && !hasValidationErrors;
  const showRevoke = !isRevoked && !isExecuted && !isDraft;
  const showDelete = isDraft && !isRevoked && !isExecuted;

  return (
    <div className={`flex flex-wrap gap-2 ${className || ''}`}>
      {showEdit && (
        <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5">
          <PenTool className="h-3.5 w-3.5" /> Edit Will
        </Button>
      )}
      
      {showExecute && (
        <Button onClick={onExecute} size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
          <UserCheck className="h-3.5 w-3.5" /> Execute Will
        </Button>
      )}

      {showRevoke && (
        <Button variant="outline" size="sm" onClick={onRevoke} className="text-red-600 border-red-200 hover:text-red-700 hover:border-red-300 hover:bg-red-50 gap-1.5">
          <ShieldBan className="h-3.5 w-3.5 text-red-500" /> Revoke Will
        </Button>
      )}

      {showDelete && (
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-500 h-8 w-8 p-0">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete Draft</span>
        </Button>
      )}
    </div>
  );
};