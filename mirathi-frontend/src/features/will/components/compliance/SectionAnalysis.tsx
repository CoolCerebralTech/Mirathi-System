import React from 'react';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui';
import { Badge } from '@/components/ui';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import type { SectionAnalysis as SectionAnalysisType, LegalSectionResult } from '@/types/will.types';
import { cn } from '@/lib/utils';

interface SectionAnalysisProps {
  analysis: SectionAnalysisType;
  className?: string;
}

export const SectionAnalysis: React.FC<SectionAnalysisProps> = ({ analysis, className }) => {
  // Helper to render the status badge for a section
  const SectionStatusBadge = ({ status }: { status: 'PASS' | 'WARN' | 'FAIL' }) => {
    switch (status) {
      case 'PASS':
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Pass
          </Badge>
        );
      case 'WARN':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <AlertCircle className="mr-1 h-3 w-3" /> Warning
          </Badge>
        );
      case 'FAIL':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="mr-1 h-3 w-3" /> Fail
          </Badge>
        );
    }
  };

  // Helper to render the content of a section
  const SectionContent = ({ result }: { result: LegalSectionResult }) => {
    if (result.status === 'PASS' && result.issues.length === 0) {
        return <p className="text-sm text-slate-500 py-2">All requirements met.</p>;
    }

    return (
      <ul className="space-y-2 py-2">
        {result.issues.map((issue, idx) => (
          <li key={idx} className={cn(
            "text-sm flex items-start gap-2 p-2 rounded",
            issue.severity === 'CRITICAL' ? "bg-red-50 text-red-800" :
            issue.severity === 'HIGH' ? "bg-orange-50 text-orange-800" :
            "bg-amber-50 text-amber-800"
          )}>
            <span className="font-mono text-xs font-bold px-1.5 py-0.5 bg-white/50 rounded">
                {issue.code}
            </span>
            <span>{issue.message}</span>
          </li>
        ))}
      </ul>
    );
  };

  // Sections configuration based on Kenyan Law (LSA Cap 160)
  const sections = [
    {
      id: 's5_capacity',
      title: 'S.5 Testamentary Capacity',
      description: 'Age, Sound Mind, and Freedom from Influence',
      data: analysis.s5_capacity
    },
    {
      id: 's11_execution',
      title: 'S.11 Execution Formalities',
      description: 'Signature, Witnesses, and Attestation',
      data: analysis.s11_execution
    },
    {
      id: 's26_dependants',
      title: 'S.26 Provision for Dependants',
      description: 'Adequate provision for spouse and children',
      data: analysis.s26_dependants
    },
    {
      id: 's83_executors',
      title: 'S.83 Executors & Trustees',
      description: 'Appointment validity and competence',
      data: analysis.s83_executors
    }
  ];

  return (
    <div className={className}>
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Detailed Section Analysis (LSA Cap 160)</h3>
      <Accordion type="single" collapsible className="w-full">
        {sections.map((section) => (
          <AccordionItem key={section.id} value={section.id}>
            <AccordionTrigger className="hover:no-underline">
              <div className="flex flex-1 items-center justify-between pr-4">
                <div className="text-left">
                  <div className="font-medium text-slate-900">{section.title}</div>
                  <div className="text-xs text-muted-foreground font-normal">{section.description}</div>
                </div>
                <SectionStatusBadge status={section.data.status} />
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <SectionContent result={section.data} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};