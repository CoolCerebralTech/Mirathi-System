import React from 'react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Label } from '@/components/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { PlusCircle, Trash2, UserCheck } from 'lucide-react';
import { DeclarationChecklist, type DeclarationState } from './DeclarationChecklist';

// Matches part of ExecuteWillRequestSchema
export interface WitnessDraft {
  id: string; // Temporary ID for UI handling
  fullName: string;
  nationalId: string;
  physicalAddress: string;
  email?: string;
  phone?: string;
  declarations: DeclarationState;
}

interface WitnessCaptureProps {
  witnesses: WitnessDraft[];
  onChange: (witnesses: WitnessDraft[]) => void;
}

export const WitnessCapture: React.FC<WitnessCaptureProps> = ({ witnesses, onChange }) => {
  const addWitness = () => {
    const newWitness: WitnessDraft = {
      id: crypto.randomUUID(),
      fullName: '',
      nationalId: '',
      physicalAddress: '',
      declarations: {
        isNotBeneficiary: false,
        isNotSpouseOfBeneficiary: false,
        isOfSoundMind: false,
        understandsDocument: false,
        isActingVoluntarily: false
      }
    };
    onChange([...witnesses, newWitness]);
  };

  const removeWitness = (id: string) => {
    onChange(witnesses.filter(w => w.id !== id));
  };

  // FIX: Using Generics to strictly type the field and its corresponding value
  const updateWitness = <K extends keyof WitnessDraft>(
    id: string, 
    field: K, 
    value: WitnessDraft[K]
  ) => {
    onChange(witnesses.map(w => w.id === id ? { ...w, [field]: value } : w));
  };

  return (
    <div className="space-y-6">
      {witnesses.map((witness, index) => (
        <Card key={witness.id} className="border-indigo-100 shadow-md">
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-indigo-600" />
                Witness #{index + 1}
              </CardTitle>
              {witnesses.length > 2 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeWitness(witness.id)}
                  className="text-red-500 h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Personal Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name (As per ID)</Label>
                <Input 
                  value={witness.fullName}
                  onChange={(e) => updateWitness(witness.id, 'fullName', e.target.value)}
                  placeholder="e.g., John Kamau Njoroge"
                />
              </div>
              <div className="space-y-2">
                <Label>National ID Number</Label>
                <Input 
                  value={witness.nationalId}
                  onChange={(e) => updateWitness(witness.id, 'nationalId', e.target.value)}
                  placeholder="e.g., 12345678"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Physical Address</Label>
                <Input 
                  value={witness.physicalAddress}
                  onChange={(e) => updateWitness(witness.id, 'physicalAddress', e.target.value)}
                  placeholder="e.g., Plot 45, Moi Avenue, Nairobi"
                />
              </div>
            </div>

            {/* Declarations */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500 tracking-wide">
                Statutory Declarations (S.11)
              </Label>
              <DeclarationChecklist 
                value={witness.declarations}
                onChange={(val) => updateWitness(witness.id, 'declarations', val)}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <Button 
        type="button" 
        variant="outline" 
        className="w-full border-dashed border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50"
        onClick={addWitness}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Another Witness
      </Button>
    </div>
  );
};