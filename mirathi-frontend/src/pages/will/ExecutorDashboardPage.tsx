import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronRight, 
  Loader2,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui';
import { Button } from '@/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui';
import { EmptyState } from '@/components/common';
import { useExecutorAssignments } from '../../features/will/will.api';
import type { ExecutorAssignmentResponse } from '@/types/will.types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const ExecutorDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('requests');

  // Fetch assignments
  const { data: assignments, isLoading } = useExecutorAssignments();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Filter data based on status
  const pendingRequests = assignments?.filter(a => a.consentStatus === 'PENDING') || [];
  const activeCases = assignments?.filter(a => a.consentStatus === 'CONSENTED') || [];
  
  // Mock handler for consenting (API mutation would go here)
  const handleConsent = (_willId: string, accept: boolean) => {
    // In a real implementation: useAcceptExecutorInvite.mutate({ willId, accept })
    toast.info(accept ? "Accepting appointment..." : "Declining appointment...");
    // navigate(`/wills/${willId}/consent`); // Example flow
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-1">
             <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
                <Briefcase className="h-6 w-6" />
             </div>
             <div>
                <h1 className="text-2xl font-bold text-slate-900">Executor Dashboard</h1>
                <p className="text-sm text-slate-500">Manage your appointments and estate duties</p>
             </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        
        {/* Warning about Intermeddling */}
        <Alert className="mb-8 bg-amber-50 border-amber-200 text-amber-900">
           <ShieldAlert className="h-5 w-5 text-amber-600" />
           <AlertTitle>Legal Warning: Intermeddling</AlertTitle>
           <AlertDescription className="text-sm text-amber-800">
             Do not handle any assets of a deceased person until you have the <strong>Grant of Probate</strong>. 
             Unauthorized handling is a criminal offense under Section 45 of the Law of Succession Act.
           </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="requests" className="gap-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
              Pending Requests
              {pendingRequests.length > 0 && (
                <Badge variant="secondary" className="bg-indigo-200 text-indigo-800 hover:bg-indigo-200 h-5 px-1.5">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-2">
              Active Estates
              {activeCases.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5">
                  {activeCases.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* --- TAB: PENDING REQUESTS --- */}
          <TabsContent value="requests" className="space-y-4">
            {pendingRequests.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="No Pending Requests"
                description="You have no outstanding invitations to be an executor."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingRequests.map((item) => (
                   <AssignmentCard 
                     key={item.willId} 
                     data={item} 
                     onAction={handleConsent} 
                     isRequest={true}
                   />
                ))}
              </div>
            )}
          </TabsContent>

          {/* --- TAB: ACTIVE CASES --- */}
          <TabsContent value="active" className="space-y-4">
             {activeCases.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No Active Estates"
                description="You are not currently managing any active estates."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {activeCases.map((item) => (
                   <AssignmentCard 
                     key={item.willId} 
                     data={item} 
                     onAction={handleConsent} 
                     isRequest={false}
                   />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// --- Sub-component: Assignment Card ---

interface AssignmentCardProps {
  data: ExecutorAssignmentResponse;
  onAction: (willId: string, accept: boolean) => void;
  isRequest: boolean;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({ data, onAction, isRequest }) => {
  const navigate = useNavigate();

  return (
    <Card className={cn(
        "transition-all hover:shadow-md border-l-4", 
        isRequest ? "border-l-indigo-500" : "border-l-emerald-500"
    )}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
           <div>
              <CardDescription className="text-xs uppercase tracking-wider font-semibold mb-1">
                 {isRequest ? 'Appointment Request' : 'Active Management'}
              </CardDescription>
              <CardTitle className="text-lg font-bold text-slate-900">
                 Estate of {data.testatorId.substring(0, 8)}... {/* Assuming name is fetched or using ID for now */}
              </CardTitle>
           </div>
           <Badge variant="outline" className={cn(
               data.myRole === 'PRIMARY' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-600'
           )}>
               {data.myRole.replace(/_/g, ' ')}
           </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-4 text-sm space-y-3">
         <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-0.5">
               <span className="text-xs text-muted-foreground">Appointed Date</span>
               <span className="font-medium text-slate-700 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(data.appointmentDate).toLocaleDateString()}
               </span>
            </div>
            <div className="flex flex-col gap-0.5">
               <span className="text-xs text-muted-foreground">Compensation</span>
               <span className="font-medium text-slate-700">
                  {data.compensationSummary || 'Not Specified'}
               </span>
            </div>
         </div>

         {!data.isQualified && (
             <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Qualification Issue: {data.disqualificationRisk}</span>
             </div>
         )}
      </CardContent>

      <CardFooter className="pt-0 flex gap-3">
         {isRequest ? (
            <>
              <Button 
                variant="outline" 
                className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                onClick={() => onAction(data.willId, false)}
              >
                 <XCircle className="mr-2 h-4 w-4" /> Decline
              </Button>
              <Button 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                onClick={() => onAction(data.willId, true)}
              >
                 <CheckCircle2 className="mr-2 h-4 w-4" /> Accept
              </Button>
            </>
         ) : (
            <Button 
              className="w-full gap-2" 
              variant="secondary"
              onClick={() => navigate(`/estate/${data.willId}/dashboard`)} // Navigate to Estate Service Dashboard
            >
               Go to Estate Console <ChevronRight className="h-4 w-4" />
            </Button>
         )}
      </CardFooter>
    </Card>
  );
};