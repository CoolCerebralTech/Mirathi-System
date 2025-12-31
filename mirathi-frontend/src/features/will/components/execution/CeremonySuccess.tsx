import React from 'react';
import { Button, Card } from '@/components/ui';
import { CheckCircle2, Download, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CeremonySuccessProps {
  willId: string;
  onDownload?: () => void;
}

export const CeremonySuccess: React.FC<CeremonySuccessProps> = ({ willId, onDownload }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center max-w-lg mx-auto">
      <div className="mb-6 rounded-full bg-emerald-100 p-6">
        <CheckCircle2 className="h-16 w-16 text-emerald-600" />
      </div>

      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        Execution Complete
      </h1>
      <p className="text-slate-600 mb-8">
        Your Will has been legally executed and witnessed according to Section 11 of the Law of Succession Act.
      </p>

      <Card className="w-full p-4 bg-slate-50 border-slate-200 mb-8 text-left flex items-start gap-4">
        <ShieldCheck className="h-6 w-6 text-indigo-600 shrink-0 mt-1" />
        <div>
          <h4 className="font-semibold text-slate-900">What happens next?</h4>
          <p className="text-sm text-slate-600 mt-1">
            Download the PDF and keep it in a safe place.
          </p>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Button
          onClick={onDownload}
          variant="outline"
          className="flex-1 gap-2 h-12"
        >
          <Download className="h-4 w-4" />
          Download Signed Copy
        </Button>

        <Button
          onClick={() => navigate(`/dashboard/will/${willId}`)}
          className="flex-1 gap-2 h-12 bg-indigo-600 hover:bg-indigo-700"
        >
          Return to Dashboard
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
