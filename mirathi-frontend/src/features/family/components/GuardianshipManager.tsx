// FILE: src/components/family/GuardianshipManager.tsx

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ShieldCheck, AlertTriangle, CheckCircle, Scale, Loader2, Info } from 'lucide-react';
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
} from '@/api/family/family.api';
import type {
  GuardianEligibilityChecklist,
  EligibilityCheckResponse,
  AssignGuardianInput,
  CheckGuardianEligibilityInput,
  FamilyTreeNode,
} from '@/types/family.types';

interface GuardianshipManagerProps {
  familyId: string;
  wardId: string;
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Normalized node type for potential guardians
 */
interface PotentialGuardianNode {
  id: string;
  name: string;
  role: string;
  isAlive: boolean;
  isMinor: boolean;
}

/**
 * Form data structure
 */
interface GuardianChecklistForm {
  checklist: GuardianEligibilityChecklist;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Transforms family tree data into potential guardian candidates
 */
const extractPotentialGuardians = (
  tree: FamilyTreeNode | undefined,
  wardId: string
): PotentialGuardianNode[] => {
  if (!tree) return [];

  const candidates: PotentialGuardianNode[] = [];

  // Self (root node)
  candidates.push({
    id: tree.id,
    name: tree.name,
    role: tree.role,
    isAlive: tree.isAlive,
    isMinor: false, // Root is always adult
  });

  // Spouses - all assumed to be adults and alive
  if (tree.spouses) {
    tree.spouses.forEach((spouse) => {
      candidates.push({
        id: spouse.id,
        name: spouse.name,
        role: 'Spouse', // TreeSpouse doesn't have role, we infer it
        isAlive: true, 
        isMinor: false,
      });
    });
  }

  // Parents
  if (tree.parents) {
    tree.parents.forEach((parent) => {
      candidates.push({
        id: parent.id,
        name: parent.name,
        role: parent.role,
        isAlive: true, // TreeParent doesn't explicit live status in summary, assume true
        isMinor: false,
      });
    });
  }

  // Children - may be minors
  if (tree.children) {
    tree.children.forEach((child) => {
      candidates.push({
        id: child.id,
        name: child.name,
        role: 'Child',
        isAlive: true,
        isMinor: child.isMinor,
      });
    });
  }

  // Filter out ineligible candidates
  return candidates.filter((candidate) => {
    if (candidate.id === wardId) return false; // Can't guard themselves
    if (!candidate.isAlive) return false; // Must be alive
    if (candidate.isMinor) return false; // Must be adult
    return true;
  });
};

/**
 * Creates default checklist values
 */
const getDefaultChecklist = (): GuardianEligibilityChecklist => ({
  // Critical Requirements
  isOver18: true,
  hasNoCriminalRecord: true,
  isMentallyCapable: true,

  // Financial & Stability
  hasFinancialStability: false,
  hasStableResidence: false,

  // Character
  hasGoodMoralCharacter: true,
  isNotBeneficiary: false,
  hasNoSubstanceAbuse: true,

  // Practical
  isPhysicallyCapable: true,
  hasTimeAvailability: true,

  // Relationship & Legal
  hasCloseRelationship: true,
  hasWardConsent: false,
  understandsLegalDuties: false,
  willingToPostBond: false,
});

// ============================================================================
// COMPONENT
// ============================================================================

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
  const form = useForm<GuardianChecklistForm>({
    defaultValues: {
      checklist: getDefaultChecklist(),
    },
  });

  // Extract potential guardians
  const potentialGuardians = extractPotentialGuardians(tree, wardId);

  // Handlers
  const handleCheck = (data: GuardianChecklistForm): void => {
    if (!selectedGuardianId) return;
    
    const checkInput: CheckGuardianEligibilityInput = {
      guardianId: selectedGuardianId,
      wardId,
      checklist: data.checklist,
    };
    
    checkEligibility(checkInput);
  };

  const handleAssign = (): void => {
    if (!eligibilityResult || !selectedGuardianId) return;
    
    const assignmentData: AssignGuardianInput = {
      wardId,
      guardianId: selectedGuardianId,
      isPrimary: true,
      checklist: form.getValues().checklist,
    };
    
    assignGuardian(assignmentData);
  };

  const handleReset = (): void => {
    setEligibilityResult(null);
    setSelectedGuardianId('');
    form.reset();
  };

  // Loading State
  if (loadingStatus) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // VIEW 1: Active Guardianship Display
  if (status?.hasGuardian && status.guardianship) {
    // We access the guardianship record directly if available, or fall back to assignment summaries
    const primary = status.primaryGuardian;

    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <CardTitle className="text-base text-green-800">Guardian Assigned</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary Guardian */}
          {primary && (
            <div className="flex justify-between items-center rounded-lg bg-white p-4 border">
              <div>
                <p className="font-medium">{primary.guardianName}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="bg-green-50">Primary Guardian</Badge>
                  {primary.isActive && (
                    <Badge variant="secondary">Active</Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-green-600">
                  {primary.eligibilityScore}%
                </span>
                <p className="text-xs text-muted-foreground">Eligibility Score</p>
              </div>
            </div>
          )}

          {/* Alternate Guardians */}
          {status.alternateGuardians && status.alternateGuardians.length > 0 && (
            <div>
              <Separator className="my-3" />
              <h4 className="text-sm font-medium mb-2">Alternate Guardians</h4>
              <div className="space-y-2">
                {status.alternateGuardians.map((guardian) => (
                  <div 
                    key={guardian.id} 
                    className="flex items-center justify-between bg-white p-3 rounded-lg border"
                  >
                    <div>
                      <p className="text-sm font-medium">{guardian.guardianName}</p>
                      <p className="text-xs text-muted-foreground">
                        Status: {guardian.isActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <span className="text-sm font-medium">
                      {guardian.eligibilityScore}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Compliance Status */}
          {status.compliance?.issues && status.compliance.issues.length > 0 ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Compliance Issues</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-4 space-y-1">
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
                {/* Guardian Selection */}
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
                        potentialGuardians.map((guardian) => (
                          <SelectItem key={guardian.id} value={guardian.id}>
                            {guardian.name} ({guardian.role})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Eligibility Checklist */}
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
                              name={`checklist.${check.key}`}
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-md border bg-white p-3 shadow-sm">
                                  <div className="space-y-0.5 flex-1 pr-4">
                                    <FormLabel className="text-sm font-normal cursor-pointer">
                                      {check.label}
                                      {check.required && (
                                        <span className="text-red-500 ml-1">*</span>
                                      )}
                                    </FormLabel>
                                    {check.legalRef && (
                                      <p className="text-xs text-muted-foreground">
                                        {check.legalRef}
                                      </p>
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
            // VIEW 3: Eligibility Results & Confirmation
            <div className="space-y-4 animate-in fade-in-50">
              {/* Overall Status Alert */}
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

              {/* Blocking Issues */}
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

              {/* Warnings */}
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
              
              {/* Next Steps */}
              <div className="rounded-lg bg-slate-100 p-4 text-sm">
                <strong className="block mb-2">Next Steps:</strong>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  {eligibilityResult.nextSteps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>

              {/* Legal Reference */}
              {eligibilityResult.legalReference && (
                <div className="text-xs text-muted-foreground p-3 bg-blue-50 rounded-lg">
                  <strong>Legal Reference:</strong> {eligibilityResult.legalReference}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleReset}
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