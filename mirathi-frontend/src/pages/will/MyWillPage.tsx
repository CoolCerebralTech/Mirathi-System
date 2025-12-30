import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { ScrollText, CheckCircle } from 'lucide-react';

import { useActiveWill } from '../../features/will/will.api';
import { CreateWillDialog } from '../../features/will/components/CreateWillDialog';
import { BequestManager } from '../../features/will/components/BequestManager';
import { ExecutorManager } from '../../features/will/components/ExecutorManager';
import { WillComplianceWidget } from '../../features/will/components/WillComplianceWidget';
import { WillExecutionWizard } from '../../features/will/components/WillExecutionWizard';

import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';

export function MyWillPage() {
  const navigate = useNavigate();
  const { data: will, isLoading } = useActiveWill();

  if (isLoading) return <div className="h-96 flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  // Scenario 1: No Will -> Hero Section
  if (!will) {
    return (
      <div className="container max-w-4xl py-20 text-center">
        <div className="bg-slate-50 border rounded-2xl p-10 space-y-6">
           <div className="mx-auto bg-white p-4 rounded-full w-20 h-20 flex items-center justify-center shadow-sm">
             <ScrollText className="h-10 w-10 text-primary" />
           </div>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900">
             Create Your Digital Will
           </h1>
           <p className="text-lg text-slate-600 max-w-xl mx-auto">
             Secure your family's future. Our guided wizard ensures your Will complies with the Kenyan Law of Succession Act (Cap 160).
           </p>
           <CreateWillDialog />
        </div>
      </div>
    );
  }

  // Scenario 2: Active Will Dashboard
  const isDraft = will.status === 'DRAFT';

  return (
    <div className="space-y-6 p-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Last Will & Testament</h1>
            <Badge className={isDraft ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}>
              {will.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
             Version {will.versionNumber} • Created {new Date(will.createdAt).toLocaleDateString()}
          </p>
        </div>
        
        {/* Action Buttons */}
        {isDraft && (
           <WillExecutionWizard willId={will.id} />
        )}
        {!isDraft && (
           <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2 rounded-md border border-green-200">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Legally Executed</span>
           </div>
        )}
      </div>

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Intelligence & Compliance */}
        <div className="lg:col-span-1 space-y-6">
           <WillComplianceWidget willId={will.id} />
        </div>

        {/* Center/Right: Drafting Tools */}
        <div className="lg:col-span-2">
           <Tabs defaultValue="bequests">
             <TabsList className="w-full justify-start">
               <TabsTrigger value="bequests">Beneficiaries (Bequests)</TabsTrigger>
               <TabsTrigger value="executors">Executors</TabsTrigger>
               <TabsTrigger value="preview">Preview Document</TabsTrigger>
             </TabsList>
             
             <TabsContent value="bequests" className="mt-4">
                <BequestManager willId={will.id} bequests={will.bequests} />
             </TabsContent>
             
             <TabsContent value="executors" className="mt-4">
                <ExecutorManager willId={will.id} executors={will.executors} />
             </TabsContent>

             <TabsContent value="preview" className="mt-4">
                <div className="p-8 bg-white border shadow-sm rounded-md min-h-[500px] font-serif">
                   <h2 className="text-2xl font-bold text-center mb-6">LAST WILL AND TESTAMENT</h2>
                   <p className="text-center italic mb-8">Of [Your Name Here]</p>
                   <p>I, <strong>[User Name]</strong>, of [Address], declare this to be my last will...</p>
                   <p className="text-muted-foreground mt-4 text-center">[Preview Mode: Full Legal Text Generation...]</p>
                </div>
             </TabsContent>
           </Tabs>
        </div>
      </div>
    </div>
  );
}