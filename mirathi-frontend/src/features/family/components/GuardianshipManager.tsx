// ============================================================================
// FILE 5: GuardianshipManager.tsx - UPDATED (Fixed Types)
// ============================================================================

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
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
  Badge,
  Separator,
} from '@/components/ui';
import { 
  useGuardianshipStatus, 
  useCheckGuardianEligibility, 
  useAssignGuardian, 
  useFamilyTree,
  useGuardianshipChecklist
} from '../family.api';
import type {
  GuardianEligibilityChecklist,
  EligibilityCheckResponse} from '@/types/family.types';

interface GuardianshipManagerProps {
  familyId: string;
  wardId: string;
}

type PotentialGuardianNode = {
  id: string;
  name: string;
  role: string;
  isAlive?: boolean;
  isMinor?: boolean;
};

export const GuardianshipManager: React.FC<GuardianshipManagerProps> = ({ 
  familyId, 
  wardId 
}) => {
  const [selectedGuardianId, setSelectedGuardianId] = useState<string>('');
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityCheckResponse | null>(null);

  // Queries
  const { data: status, isLoading: loadingStatus } = useGuardianshipStatus(wardId);
  const { data: tree } = useFamilyTree(familyId);
  const { data: template } = useGuardianshipChecklist();

  // Mutations
  const { mutate: checkEligibility, isPending: checking } = useCheckGuardianEligibility({
    onSuccess: (result) => setEligibilityResult(result)
  });
  const { mutate: assignGuardian, isPending: assigning } = useAssignGuardian(familyId, wardId, {
    onSuccess: () => {
      setEligibilityResult(null);
      setSelectedGuardianId('');
    }
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

  // Filter potential guardians
  const potentialGuardians: PotentialGuardianNode[] = tree
    ? [
        { id: tree.id, name: tree.name, role: tree.role, isAlive: tree.isAlive, isMinor: tree.isMinor },
        ...(tree.spouses || []).map(s => ({ id: s.id, name: s.name, role: s.role || 'Spouse', isAlive: s.isAlive })),
        ...(tree.parents || []).map(p => ({ id: p.id, name: p.name, role: p.role, isAlive: p.isAlive })),
        ...(tree.children || []).map(c => ({ id: c.id, name: c.name, role: c.role || 'Child', isAlive: c.isAlive, isMinor: c.isMinor }))
      ].filter((m) => {
        if (m.id === wardId) return false;
        if (m.isAlive === false) return false;
        if (m.isMinor === true) return false;
        return true;
      })
    : [];

  const handleCheck = (data: { checklist: GuardianEligibilityChecklist }) => {
    if (!selectedGuardianId) return;
    
    checkEligibility({
      guardianId: selectedGuardianId,
      wardId,
      checklist: data.checklist
    });
  };

  const handleAssign = () => {
    if (!eligibilityResult) return;
    
    assignGuardian({
      wardId,
      guardianId: selectedGuardianId,
      isPrimary: true,
      isAlternate: false,
      priorityOrder: 1,
      checklist: form.getValues().checklist
    });
  };

  if (loadingStatus) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // VIEW 1: Active Guardianship
  if (status?.hasGuardian && status.primaryGuardian) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <CardTitle className="text-base text-green-800">Guardian Assigned</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center rounded-lg bg-white p-4 border">
            <div>
              <p className="font-medium">{status.primaryGuardian.guardianName}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="bg-green-50">Primary Guardian</Badge>
                {status.primaryGuardian.courtApproved && (
                  <Badge variant="secondary">Court Approved</Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-green-600">
                {status.primaryGuardian.overallScore}%
              </span>
              <p className="text-xs text-muted-foreground">Suitability Score</p>
            </div>
          </div>

          {status.alternateGuardians && status.alternateGuardians.length > 0 && (
            <div>
              <Separator className="my-3" />
              <h4 className="text-sm font-medium mb-2">Alternate Guardians</h4>
              <div className="space-y-2">
                {status.alternateGuardians.map((guardian) => (
                  <div key={guardian.id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">{guardian.guardianName}</p>
                      <p className="text-xs text-muted-foreground">Priority: {guardian.priorityOrder}</p>
                    </div>
                    <span className="text-sm font-medium">{guardian.overallScore}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {status.compliance?.issues && status.compliance.issues.length > 0 ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Compliance Issues</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-4">
                  {status.compliance.issues.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-white p-3 rounded-lg border border-green-200">
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Assign Guardian
        </CardTitle>
      </CardHeader>
      <CardContent>
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
                      {potentialGuardians.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No eligible guardians found
                        </div>
                      ) : (
                        potentialGuardians.map(g => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.name} ({g.role})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {selectedGuardianId && template && (
                  <div className="space-y-4 rounded-lg border p-4 bg-slate-50">
                    <h4 className="font-medium flex items-center gap-2">
                      <Scale className="h-4 w-4" /> Legal Eligibility Checklist
                    </h4>
                    
                    {template.sections.map((section, sectionIdx) => (
                      <div key={sectionIdx} className="space-y-3">
                        <h5 className="text-sm font-medium text-muted-foreground">
                          {section.category}
                        </h5>
                        <div className="grid grid-cols-1 gap-3">
                          {section.checks.map((check) => (
                            <FormField
                              key={check.key}
                              control={form.control}
                              name={`checklist.${check.key}` as any}
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-md border bg-white p-3 shadow-sm">
                                  <div className="space-y-0.5 flex-1 pr-4">
                                    <FormLabel className="text-sm font-normal cursor-pointer">
                                      {check.label}
                                      {check.required && <span className="text-red-500 ml-1">*</span>}
                                    </FormLabel>
                                    {check.legalRef && (
                                      <p className="text-xs text-muted-foreground">{check.legalRef}</p>
                                    )}
                                  </div>
                                  <FormControl>
                                    <Switch 
                                      checked={field.value as boolean} 
                                      onCheckedChange={field.onChange} 
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    ))}

                    <p className="text-xs text-center text-muted-foreground mt-4 pt-4 border-t">
                      Based on Kenyan Children Act (Cap 141). Complete all sections for accurate assessment.
                    </p>

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
                {eligibilityResult.isEligible ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {eligibilityResult.isEligible ? "Candidate Eligible" : "Not Recommended"}
                </AlertTitle>
                <AlertDescription>
                  Overall Score: {eligibilityResult.overallScore}/100
                  <div className="mt-2 space-y-1 text-xs">
                    <div>Eligibility: {eligibilityResult.eligibilityScore}/100</div>
                    <div>Proximity: {eligibilityResult.proximityScore}/100</div>
                    <div>Relationship: {eligibilityResult.relationshipScore}/100</div>
                  </div>
                </AlertDescription>
              </Alert>

              {eligibilityResult.blockingIssues.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Blocking Issues</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4 space-y-1">
                      {eligibilityResult.blockingIssues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {eligibilityResult.warnings.length > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Warnings</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4 space-y-1">
                      {eligibilityResult.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="rounded-lg bg-slate-100 p-4 text-sm">
                <strong className="block mb-2">Next Steps:</strong>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  {eligibilityResult.nextSteps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>

              {eligibilityResult.legalReference && (
                <div className="text-xs text-muted-foreground p-3 bg-blue-50 rounded-lg">
                  <strong>Legal Reference:</strong> {eligibilityResult.legalReference}
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEligibilityResult(null);
                    setSelectedGuardianId('');
                  }}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleAssign} 
                  disabled={!eligibilityResult.isEligible || assigning}
                  className="flex-1"
                >
                  {assigning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    'Confirm Assignment'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};