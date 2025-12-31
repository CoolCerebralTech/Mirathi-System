import React from 'react';
import { FileText, Gavel, FileCheck, Stethoscope } from 'lucide-react';
import { Badge } from '@/components/ui';
import { ScrollArea } from '@/components/ui';
import type { Evidence } from '@/types/will.types';
import { DisinheritanceEvidenceType } from '@/types/will.types';

interface EvidenceListProps {
  evidence: Evidence[];
  className?: string;
}

export const EvidenceList: React.FC<EvidenceListProps> = ({ evidence, className }) => {
  if (!evidence || evidence.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No supporting evidence recorded.
      </p>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case DisinheritanceEvidenceType.AFFIDAVIT:
        return FileCheck;
      case DisinheritanceEvidenceType.COURT_ORDER:
        return Gavel;
      case DisinheritanceEvidenceType.MEDICAL_REPORT:
        return Stethoscope;
      default:
        return FileText;
    }
  };

  return (
    <div className={`space-y-2 ${className || ''}`}>
      <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
        Supporting Evidence
      </h5>
      <ScrollArea className="h-full max-h-[150px]">
        <ul className="space-y-2 pr-2">
          {evidence.map((item, index) => {
            const Icon = getIcon(item.type);
            return (
              <li key={index} className="flex items-start gap-3 bg-slate-50 p-2.5 rounded border border-slate-100">
                <Icon className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">
                      {item.type.replace(/_/g, ' ')}
                    </span>
                    {item.documentId && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1 py-0">
                        File Attached
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-snug">
                    {item.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </div>
  );
};