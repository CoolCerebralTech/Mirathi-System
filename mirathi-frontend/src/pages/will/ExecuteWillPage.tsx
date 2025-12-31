import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Loader2, 
  ArrowLeft, 
  ShieldCheck, 
  AlertOctagon, 
  CheckCircle2 
} from 'lucide-react';
import { Button } from '@/components/ui';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui';
import { useWillDetail } from '@/features/will/will.api';
import { WillStatus } from '@/types/will.types';

// Components
import { ExecutionWizard } from '@/features/will/components';
import { ValidationErrorsList } from '@/features/will/components';

export const ExecuteWillPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: will, isLoading, isError } = useWillDetail(id!);

  // Guard Clause: Redirect if not loadable or invalid state
  useEffect(() => {
    if (will) {
      // If already executed, don't show the wizard again
      if (will.status === WillStatus.EXECUTED || will.status === WillStatus.ACTIVE) {
        // Option: could redirect to the summary page
      }
    }
  }, [will, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isError || !will) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-slate-50">
        <AlertOctagon className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-bold text-slate-900">Will Not Found</h2>
        <Button variant="outline" onClick={() => navigate('/dashboard/wills')}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  // 1. Check if Will is blocked by validation errors
  if (will.validationErrors.length > 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Editor
          </Button>
          
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center space-y-6">
            <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertOctagon className="h-8 w-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900">
              Execution Blocked
            </h1>
            
            <p className="text-slate-600">
              This Will cannot be executed because it contains critical validation errors. 
              According to the Law of Succession Act, an invalid will is void ab initio.
            </p>

            <div className="text-left">
              <ValidationErrorsList errors={will.validationErrors} />
            </div>

            <Button onClick={() => navigate(`/dashboard/will/${id}/edit`)}>
              Return to Editor to Fix Issues
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Check if already executed
  if (will.status === WillStatus.EXECUTED || will.status === WillStatus.ACTIVE) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center space-y-6 max-w-md">
           <div className="mx-auto h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
           </div>
           <h1 className="text-2xl font-bold text-slate-900">Already Executed</h1>
           <p className="text-slate-600">
             This Will was executed on {will.executionDate ? new Date(will.executionDate).toLocaleDateString() : 'Unknown Date'}.
           </p>
           <Button onClick={() => navigate(`/dashboard/will/${id}`)} className="w-full">
             View Will Details
           </Button>
        </div>
      </div>
    );
  }

  // 3. Render Execution Wizard
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Simplified Header for Focus */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5 text-slate-500" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Execution Ceremony
                <span className="text-xs font-normal text-slate-500 px-2 py-0.5 bg-slate-100 rounded-full border border-slate-200">
                  S.11 Compliance Mode
                </span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium">
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Secure Legal Environment</span>
          </div>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Context Banner */}
          <Alert className="mb-8 bg-indigo-50 border-indigo-100 text-indigo-900">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            <AlertTitle>You are about to make this document legally binding.</AlertTitle>
            <AlertDescription className="text-indigo-800/80">
              Ensure you are in a quiet place with your chosen witnesses present physically. 
              Digital signatures recorded here carry the same weight as wet signatures under the 
              Business Laws (Amendment) Act, 2020.
            </AlertDescription>
          </Alert>

          {/* The Wizard Component */}
          <ExecutionWizard willId={id!} />
        </div>
      </div>
    </div>
  );
};