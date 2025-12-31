import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RecordDisinheritanceRequestSchema, type RecordDisinheritanceInput } from '@/types/will.types';
import { DisinheritanceReasonCategory, DisinheritanceEvidenceType } from '@/types/will.types';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Textarea } from '@/components/ui';
import { Checkbox } from '@/components/ui';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui';
import { ShieldAlert, Plus, Trash2, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';

interface DisinheritanceFormProps {
  onSubmit: (data: RecordDisinheritanceInput) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export const DisinheritanceForm: React.FC<DisinheritanceFormProps> = ({
  onSubmit,
  isLoading,
  onCancel,
}) => {
  const form = useForm<RecordDisinheritanceInput>({
    resolver: zodResolver(RecordDisinheritanceRequestSchema),
    defaultValues: {
      disinheritedPerson: { type: 'EXTERNAL' },
      isCompleteDisinheritance: true,
      evidence: [],
      riskMitigationSteps: []
    },
  });

  const { fields: evidenceFields, append: appendEvidence, remove: removeEvidence } = useFieldArray({
    control: form.control,
    name: "evidence"
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Warning Banner */}
        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
          <ShieldAlert className="h-4 w-4 text-red-600" />
          <AlertTitle>Legal Warning (Section 26 LSA)</AlertTitle>
          <AlertDescription className="text-sm">
            Kenyan law allows dependants (spouses/children) to challenge a Will if they are not adequately provided for. You must provide a valid reason for this exclusion.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">1. Who is being excluded?</h3>
          <FormField
            control={form.control}
            name="disinheritedPerson.externalName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="disinheritedPerson.externalRelationship"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Relationship</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Estranged Son" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="isCompleteDisinheritance"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-slate-50">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Completely exclude from Estate?</FormLabel>
                  <FormDescription>
                    Uncheck this if they are receiving a small token gift instead.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">2. Reason for Exclusion</h3>
          
          <FormField
            control={form.control}
            name="reasonCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={DisinheritanceReasonCategory.ESTRANGEMENT}>Long-term Estrangement</SelectItem>
                    <SelectItem value={DisinheritanceReasonCategory.PRIOR_PROVISION}>Already Provided For (Gifts during lifetime)</SelectItem>
                    <SelectItem value={DisinheritanceReasonCategory.ABUSE}>Abuse / Neglect against Testator</SelectItem>
                    <SelectItem value={DisinheritanceReasonCategory.TESTAMENTARY_FREEDOM}>Testamentary Freedom (Not a dependent)</SelectItem>
                    <SelectItem value={DisinheritanceReasonCategory.OTHER}>Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reasonDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Detailed Explanation</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Provide specific details (dates, events) explaining why. This will be read by the court if challenged." 
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-semibold text-slate-900">3. Supporting Evidence</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendEvidence({ type: DisinheritanceEvidenceType.AFFIDAVIT, description: '' })}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Evidence
            </Button>
          </div>

          <div className="space-y-3">
            {evidenceFields.map((field, index) => (
              <Card key={field.id} className="bg-slate-50 border-slate-200">
                <CardContent className="p-3 grid gap-3">
                   <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                         <FileText className="h-4 w-4 text-slate-500" />
                         <span className="text-sm font-medium">Document {index + 1}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500"
                        onClick={() => removeEvidence(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <FormField
                            control={form.control}
                            name={`evidence.${index}.type`}
                            render={({ field }) => (
                            <FormItem>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger className="h-9 bg-white">
                                    <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value={DisinheritanceEvidenceType.AFFIDAVIT}>Affidavit</SelectItem>
                                    <SelectItem value={DisinheritanceEvidenceType.PRIOR_GIFT_DOCUMENTATION}>Proof of Prior Gifts</SelectItem>
                                    <SelectItem value={DisinheritanceEvidenceType.FAMILY_AGREEMENT}>Family Agreement</SelectItem>
                                    <SelectItem value={DisinheritanceEvidenceType.COURT_ORDER}>Court Order</SelectItem>
                                    <SelectItem value={DisinheritanceEvidenceType.MEDICAL_REPORT}>Medical Report</SelectItem>
                                    <SelectItem value={DisinheritanceEvidenceType.WILL_CLARIFICATION}>Will Clarification</SelectItem>
                                </SelectContent>
                                </Select>
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name={`evidence.${index}.description`}
                            render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                <Input placeholder="Description of document..." className="h-9 bg-white" {...field} />
                                </FormControl>
                            </FormItem>
                            )}
                        />
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading} variant="destructive">
            {isLoading ? 'Recording...' : 'Confirm Exclusion'}
          </Button>
        </div>
      </form>
    </Form>
  );
};