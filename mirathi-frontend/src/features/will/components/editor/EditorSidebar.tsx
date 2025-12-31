import React from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from '@/components/ui';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui';
import { Lightbulb, BookOpen, AlertTriangle } from 'lucide-react';
import type { EditorTabValue } from './EditorTabs';

interface EditorSidebarProps {
  activeSection: EditorTabValue;
  className?: string;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({ 
  activeSection, 
  className 
}) => {
  // Content Database (In a real app, this might come from a CMS or JSON file)
  const getHelpContent = () => {
    switch (activeSection) {
      case 'executors':
        return {
          title: "Choosing an Executor",
          tips: [
            "An executor is the person who will carry out the instructions in your will.",
            "You can choose up to 4 executors.",
            "An executor can also be a beneficiary.",
            "Ensure they are over 18 and of sound mind."
          ],
          lawRef: "S.6 of the Law of Succession Act"
        };
      case 'beneficiaries':
        return {
          title: "Distributing Assets",
          tips: [
            "Be specific about items to avoid confusion.",
            "Consider what happens if a beneficiary dies before you (Alternate Beneficiaries).",
            "S.26 allows dependants to challenge the will if they are not adequately provided for."
          ],
          lawRef: "S.26 Provision for Dependants"
        };
      case 'witnesses':
        return {
          title: "Witness Requirements",
          tips: [
            "You need at least 2 witnesses present at the same time.",
            "Witnesses CANNOT be beneficiaries (or spouses of beneficiaries). If they are, their gift is void.",
            "They must see you sign the document."
          ],
          lawRef: "S.11 Execution of Wills",
          warning: "Critical: A beneficiary cannot witness the will."
        };
      case 'basics':
      default:
        return {
          title: "Drafting Your Will",
          tips: [
            "A will only takes effect upon death.",
            "It must be in writing and signed by you.",
            "You can revoke or change this will at any time while you are alive."
          ],
          lawRef: "S.8 Capacity of Testator"
        };
    }
  };

  const content = getHelpContent();

  return (
    <div className={`w-full lg:w-80 space-y-4 ${className}`}>
      <Card className="bg-indigo-50 border-indigo-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-indigo-900 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-indigo-600" />
            Mirathi Copilot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-indigo-800 font-medium mb-2">
            {content.title}
          </p>
          <ul className="space-y-2">
            {content.tips.map((tip, idx) => (
              <li key={idx} className="text-xs text-indigo-700 leading-snug flex items-start gap-2">
                <span className="block h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                {tip}
              </li>
            ))}
          </ul>

          {content.warning && (
            <div className="mt-4 p-2 bg-amber-100 rounded border border-amber-200 text-xs text-amber-800 flex gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {content.warning}
            </div>
          )}
        </CardContent>
      </Card>

      <Accordion type="single" collapsible className="w-full bg-white rounded-lg border px-3">
        <AccordionItem value="law-ref" className="border-b-0">
          <AccordionTrigger className="text-xs font-semibold text-slate-600 hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5" />
              Legal Reference
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-xs text-slate-500 pb-2">
              This section is governed by <span className="font-medium text-slate-900">{content.lawRef}</span> of the Kenyan Law of Succession Act (Cap 160).
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};