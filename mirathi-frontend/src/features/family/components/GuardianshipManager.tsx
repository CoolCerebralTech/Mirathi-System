// FILE: src/features/family/components/GuardianshipManager.tsx

import React, { useState } from 'react';
import { useForm, type Path } from 'react-hook-form';
import { ShieldCheck, AlertTriangle, CheckCircle, Scale, Loader2 } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  Switch,
  Alert,
  AlertTitle,
  AlertDescription,
  Badge
} from '@/components/ui';
import { 
  useGuardianshipStatus, 
  useCheckEligibility, 
  useAssignGuardian, 
  useFamilyTree,
  useGuardianshipChecklist
} from '../family.api';
import type {
    GuardianEligibilityChecklist,
    EligibilityCheckResponse,
    FamilyTreeNode,
    TreeSpouse,
    TreeParent,
    TreeChild
} from '@/types/family.types';

interface GuardianshipManagerProps {
  familyId: string;
  wardId: string;
}

// 1. Define a Union Type for all possible people in the tree
type PotentialGuardianNode = FamilyTreeNode | TreeSpouse | TreeParent | TreeChild;

export const GuardianshipManager: React.FC<GuardianshipManagerProps> = ({ familyId, wardId }) => {
  const [selectedGuardianId, setSelectedGuardianId] = useState<string>('');
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityCheckResponse | null>(null);

  // Queries
  const { data: status, isLoading: loadingStatus } = useGuardianshipStatus(wardId);
  const { data: tree } = useFamilyTree(familyId);
  const { data: template } = useGuardianshipChecklist();

  // Mutations
  const { mutate: checkEligibility, isPending: checking } = useCheckEligibility();
  const { mutate: assignGuardian, isPending: assigning } = useAssignGuardian(familyId, wardId, {
    onSuccess: () => setEligibilityResult(null)
  });

  // Form Setup
  const form = useForm<{ checklist: GuardianEligibilityChecklist }>({
    defaultValues: {
      checklist: {
        isOver18: true,
        hasNoCriminalRecord: true,
        isMentallyCapable: true,
        hasFinancialStability: false,
        hasStableResidence: false,
        hasGoodMoralCharacter: true,
        isNotBeneficiary: false,
        hasNoSubstanceAbuse: true,
        isPhysicallyCapable: true,
        hasTimeAvailability: true,
        hasCloseRelationship: true,
        hasWardConsent: false,
        understandsLegalDuties: false,
        willingToPostBond: false,
      }
    }
  });

  // 2. Strict Filter Logic (No 'any')
  const potentialGuardians: PotentialGuardianNode[] = tree
    ? [
        tree, 
        ...(tree.spouses || []), 
        ...(tree.parents || []), 
        ...(tree.children || [])
      ].filter((m): m is PotentialGuardianNode => {
        // Exclude the ward themselves
        if (m.id === wardId) return false;
        
        // Exclude deceased (handle optional isAlive property safely)
        // If isAlive is undefined in the type, we assume true for now, or check strictly if false
        if (m.isAlive === false) return false; 
        
        // Exclude Minors using "in" operator type guard
        if ('isMinor' in m && (m as TreeChild).isMinor) return false;
        
        return true;
      })
    : [];

  const handleCheck = (data: { checklist: GuardianEligibilityChecklist }) => {
    if (!selectedGuardianId) return;
    checkEligibility({
      guardianId: selectedGuardianId,
      wardId,
      checklist: data.checklist
    }, {
      onSuccess: (res) => setEligibilityResult(res)
    });
  };

  const handleAssign = () => {
    if (!eligibilityResult) return;
    assignGuardian({
      wardId,
      guardianId: selectedGuardianId,
      isPrimary: true,
      checklist: form.getValues().checklist
    });
  };

  if (loadingStatus) return <div className="p-4 text-center text-sm text-muted-foreground">Checking legal status...</div>;

  // VIEW 1: Active Guardianship
  if (status?.hasGuardian) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <CardTitle className="text-base text-green-800">Guardian Assigned</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center rounded-lg bg-white p-3 border">
            <div>
              <p className="font-medium">{status.primaryGuardian?.guardianName}</p>
              <Badge variant="outline" className="mt-1">Primary Guardian</Badge>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-green-600">{status.guardianship?.overallScore}%</span>
              <p className="text-xs text-muted-foreground">Suitability Score</p>
            </div>
          </div>
          
          {status.compliance?.issues?.length ? (
            <Alert variant="destructive">
               <AlertTriangle className="h-4 w-4" />
               <AlertTitle>Compliance Issues</AlertTitle>
               <AlertDescription>
                 {status.compliance.issues.join(', ')}
               </AlertDescription>
            </Alert>
          ) : (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span>Compliant with Children Act (Cap 141)</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // VIEW 2: Assignment Form
  return (
    <div className="space-y-6">
      {!eligibilityResult ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCheck)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Guardian Candidate</label>
              <Select onValueChange={setSelectedGuardianId} value={selectedGuardianId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a family member..." />
                </SelectTrigger>
                <SelectContent>
                  {potentialGuardians.map(g => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name} 
                      {/* Safe access to role, falling back to 'Relative' if missing */}
                      {'role' in g ? ` (${g.role})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedGuardianId && template && (
              <div className="space-y-4 rounded-lg border p-4 bg-slate-50">
                <h4 className="font-medium flex items-center gap-2">
                  <Scale className="h-4 w-4" /> Legal Checklist
                </h4>
                
                <div className="grid grid-cols-1 gap-3">
                    {template.sections[0].checks.map((check) => {
                      // 1. Construct the path
                      const fieldName = `checklist.${check.key}` as Path<{ checklist: GuardianEligibilityChecklist }>;
                      
                      return (
                        <FormField
                          key={check.key}
                          control={form.control}
                          name={fieldName}
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-md border bg-white p-3 shadow-sm">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-sm font-normal cursor-pointer">{check.label}</FormLabel>
                                  {check.legalRef && <p className="text-xs text-muted-foreground">{check.legalRef}</p>}
                                </div>
                                <FormControl>
                                  {/* 
                                    FIX APPLIED HERE: 
                                    We cast field.value as boolean because we know every key 
                                    in GuardianEligibilityChecklist is a boolean.
                                  */}
                                  <Switch 
                                    checked={field.value as boolean} 
                                    onCheckedChange={field.onChange} 
                                  />
                                </FormControl>
                            </FormItem>
                          )}
                        />
                      );
                    })}
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Complete the full legal checklist to calculate score.
                    </p>
                  </div>

                <Button type="submit" className="w-full" disabled={checking}>
                  {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Check Eligibility
                </Button>
              </div>
            )}
          </form>
        </Form>
      ) : (
        // VIEW 3: Results & Confirmation
        <div className="space-y-4 animate-in fade-in-50">
          <Alert variant={eligibilityResult.isEligible ? "default" : "destructive"}>
            {eligibilityResult.isEligible ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            <AlertTitle>{eligibilityResult.isEligible ? "Candidate Eligible" : "Not Recommended"}</AlertTitle>
            <AlertDescription>
               Score: {eligibilityResult.overallScore}/100. 
               {eligibilityResult.blockingIssues.length > 0 && " Blocking issues found."}
            </AlertDescription>
          </Alert>
          
          <div className="rounded-lg bg-slate-100 p-3 text-sm">
             <strong>Next Steps:</strong>
             <ul className="list-disc pl-5 mt-1 space-y-1 text-muted-foreground">
               {eligibilityResult.nextSteps.map((step, i) => <li key={i}>{step}</li>)}
             </ul>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setEligibilityResult(null)} className="flex-1">Back</Button>
            <Button 
              onClick={handleAssign} 
              disabled={!eligibilityResult.isEligible || assigning}
              className="flex-1"
            >
              {assigning ? "Assigning..." : "Confirm Assignment"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};