import React from 'react';
import { Badge } from '@/components/ui';
import { FileText } from 'lucide-react';

interface AffectedClausesListProps {
  clauses?: string[];
  className?: string;
}

export const AffectedClausesList: React.FC<AffectedClausesListProps> = ({ 
  clauses, 
  className 
}) => {
  if (!clauses || clauses.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className || ''}`}>
      <span className="text-xs font-medium text-muted-foreground mr-1">
        Affects:
      </span>
      {clauses.map((clause, index) => (
        <Badge 
          key={index} 
          variant="secondary" 
          className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200 font-normal"
        >
          <FileText className="mr-1 h-3 w-3 text-slate-400" />
          {clause}
        </Badge>
      ))}
    </div>
  );
};