import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Label } from '@/components/ui';
import { Card } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { WitnessCapture, type WitnessDraft } from './WitnessCapture';
import { CeremonySuccess } from './CeremonySuccess';
import { ChevronRight, ChevronLeft, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { useExecuteWill } from '../../will.api';
import { format } from 'date-fns';

interface ExecutionWizardProps {
  willId: string;
}

export const ExecutionWizard: React.FC<ExecutionWizardProps> = ({ willId }) => {
  const [step, setStep] = useState(1);
  const [location, setLocation] = useState('');
  const [witnesses, setWitnesses] = useState<WitnessDraft[]>([
    {
      id: '1',
      fullName: '',
      nationalId: '',
      physicalAddress: '',
      declarations: { isNotBeneficiary: false, isNotSpouseOfBeneficiary: false, isOfSoundMind: false, understandsDocument: false, isActingVoluntarily: false }
    },
    {
      id: '2',
      fullName: '',
      nationalId: '',
      physicalAddress: '',
      declarations: { isNotBeneficiary: false, isNotSpouseOfBeneficiary: false, isOfSoundMind: false, understandsDocument: false, isActingVoluntarily: false }
    }
  ]);

  const executeMutation = useExecuteWill(willId);

  const canProceedToWitnesses = location.length > 3;
  
  const canSubmit = witnesses.length >= 2 && witnesses.every(w => 
    w.fullName && w.nationalId && 
    Object.values(w.declarations).every(val => val === true)
  );

  const handleSubmit = () => {
    executeMutation.mutate({
      executionDate: new Date().toISOString(),
      location,
      timezone: 'Africa/Nairobi',
      witnesses: witnesses.map(w => ({
        fullName: w.fullName,
        nationalId: w.nationalId,
        physicalAddress: w.physicalAddress,
        email: w.email,
        phone: w.phone,
        declarations: w.declarations
      }))
    });
  };

  if (executeMutation.isSuccess) {
    return <CeremonySuccess willId={willId} />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      {/* Stepper Header */}
      <div className="flex items-center justify-between px-2">
        {['Logistics', 'Witnesses', 'Review'].map((label, idx) => {
          const stepNum = idx + 1;
          const isActive = step >= stepNum;
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {stepNum}
              </div>
              <span className={`text-sm font-medium ${isActive ? 'text-indigo-900' : 'text-slate-500'}`}>
                {label}
              </span>
              {stepNum < 3 && <div className="w-12 h-px bg-slate-300 mx-2" />}
            </div>
          );
        })}
      </div>

      {/* Step 1: Logistics */}
      {step === 1 && (
        <Card className="p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Where is this happening?</h2>
            <p className="text-sm text-muted-foreground">
              We need to record the location and time for the digital timestamp.
            </p>
          </div>

          <div className="grid gap-4">
             <div className="space-y-2">
               <Label>Current Date & Time</Label>
               <div className="flex items-center gap-2 p-3 bg-slate-100 rounded text-slate-700">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  {format(new Date(), 'PPP p')}
               </div>
             </div>
             
             <div className="space-y-2">
               <Label>Physical Location</Label>
               <div className="relative">
                 <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                 <Input 
                   className="pl-9" 
                   placeholder="e.g. 123 Moi Avenue, Nairobi, Kenya"
                   value={location}
                   onChange={(e) => setLocation(e.target.value)}
                 />
               </div>
               <p className="text-xs text-muted-foreground">Be as specific as possible (Building, Street, Town).</p>
             </div>
          </div>
        </Card>
      )}

      {/* Step 2: Witnesses */}
      {step === 2 && (
        <div className="space-y-4">
          <Alert className="bg-blue-50 text-blue-900 border-blue-200">
             <AlertCircle className="h-4 w-4 text-blue-600" />
             <AlertDescription>
               <strong>Section 11 Requirement:</strong> You must have at least 2 witnesses present. They must see you sign, and then sign in your presence.
             </AlertDescription>
          </Alert>
          <WitnessCapture witnesses={witnesses} onChange={setWitnesses} />
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <Card className="p-6 text-center space-y-6">
          <h2 className="text-xl font-bold">Ready to Execute?</h2>
          <p className="text-slate-600">
            By clicking "Complete Execution", you are digitally signing this document in the presence of:
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            {witnesses.map(w => (
              <div key={w.id} className="bg-slate-100 px-4 py-2 rounded-full font-medium text-sm">
                {w.fullName}
              </div>
            ))}
          </div>
          <Alert variant="destructive" className="text-left bg-red-50 border-red-100 text-red-900">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription>
              Warning: Once executed, this Will becomes legally binding. You cannot edit it without creating a Codicil or a new Will.
            </AlertDescription>
          </Alert>
        </Card>
      )}

      {/* Footer Actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button 
          variant="ghost" 
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        {step < 3 ? (
          <Button 
            onClick={() => setStep(s => s + 1)}
            disabled={step === 1 && !canProceedToWitnesses}
          >
            Next Step <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            disabled={!canSubmit || executeMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 w-40"
          >
            {executeMutation.isPending ? 'Executing...' : 'Complete Execution'}
          </Button>
        )}
      </div>
    </div>
  );
};