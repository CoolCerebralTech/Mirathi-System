import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Loader2, 
  ArrowLeft, 
  RefreshCw, 
  Printer, 
  Share2, 
  AlertOctagon 
} from 'lucide-react';
import { Button } from '@/components/ui';
import { useWillCompliance, useWillDetail } from '../../features/will/will.api';
import { WillHeader } from '../../features/will/components';

// Compliance Components
import { ComplianceOverview } from '../../features/will/components';
import { SectionAnalysis } from '../../features/will/components';
import { ViolationsList } from '../../features/will/components';
import { WarningsList } from '../../features/will/components';
import { RecommendationsList } from '../../features/will/components';

export const ComplianceReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch Will Details (for header context) and Compliance Report
  const { data: will } = useWillDetail(id!);
  const { 
    data: report, 
    isLoading, 
    isError, 
    refetch, 
    isRefetching 
  } = useWillCompliance(id!, 'FULL');

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500">Analyzing legal risks...</p>
        </div>
      </div>
    );
  }

  if (isError || !report || !will) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-slate-50">
        <AlertOctagon className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-bold text-slate-900">Analysis Failed</h2>
        <p className="text-slate-500">Could not generate the legal compliance report.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  // FIX: Using the 'section' parameter to determine destination tab
  const handleFixAction = (section: string) => {
    // In a real app, we would map specific violation codes to specific tabs
    // e.g., "S.11" -> 'witnesses' tab
    let targetTab = 'review';
    
    if (section === 'violations') targetTab = 'basics'; // Often capacity issues
    if (section.includes('witness')) targetTab = 'witnesses';
    if (section.includes('executor')) targetTab = 'executors';

    navigate(`/dashboard/will/${id}/edit?tab=${targetTab}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <WillHeader
            title="Legal Compliance Audit"
            status={will.status}
            type={will.type}
            showBack={true}
            onBack={() => navigate(`/dashboard/will/${id}/edit`)}
            className="border-b-0 py-4"
            actions={
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetch()}
                  disabled={isRefetching}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
                  Re-Analyze
                </Button>
                <Button variant="ghost" size="icon">
                  <Printer className="h-4 w-4 text-slate-500" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Share2 className="h-4 w-4 text-slate-500" />
                </Button>
              </div>
            }
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Top: Overview Card */}
        <div className="mb-8">
           <ComplianceOverview report={report} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Detailed Analysis (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
               <SectionAnalysis analysis={report.sectionAnalysis} />
            </div>
          </div>

          {/* Right Column: Action Items (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* 1. Critical Violations */}
            {report.violations.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-red-900">Blocking Issues</h3>
                   <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">
                     {report.violations.length} To Fix
                   </span>
                </div>
                <ViolationsList violations={report.violations} />
                <Button 
                  className="w-full mt-4 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                  onClick={() => handleFixAction('violations')}
                >
                  Fix Critical Issues
                </Button>
              </div>
            )}

            {/* 2. Recommendations (The "Fix It" List) */}
            {report.recommendations.length > 0 && (
              <RecommendationsList 
                recommendations={report.recommendations} 
                // FIX: Using the idx parameter, though mapped to a string for the handler
                onAction={(idx) => handleFixAction(`recommendation-${idx}`)}
                className="shadow-sm"
              />
            )}

            {/* 3. Warnings */}
            {report.warnings.length > 0 && (
               <div className="bg-white p-6 rounded-xl shadow-sm border border-amber-100">
                 <div className="mb-4">
                   <h3 className="font-bold text-amber-900">Risk Factors</h3>
                 </div>
                 <WarningsList warnings={report.warnings} />
               </div>
            )}
            
            {/* Empty State if perfect */}
            {report.violations.length === 0 && report.warnings.length === 0 && (
               <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 text-center">
                  <h3 className="font-bold text-emerald-800 text-lg mb-2">Excellent!</h3>
                  <p className="text-emerald-700 text-sm">
                    No legal issues found. This Will appears to fully comply with the Law of Succession Act.
                  </p>
               </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};