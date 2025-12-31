import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddBeneficiaryRequestSchema, type AddBeneficiaryInput } from '@/types/will.types';
import { BequestType, BequestPriority, BequestConditionType } from '@/types/will.types';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Textarea } from '@/components/ui';
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
import { Card, CardContent } from '@/components/ui';
import { Plus, Trash2, Gift } from 'lucide-react';

interface BeneficiaryFormProps {
  defaultValues?: Partial<AddBeneficiaryInput>;
  onSubmit: (data: AddBeneficiaryInput) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export const BeneficiaryForm: React.FC<BeneficiaryFormProps> = ({
  defaultValues,
  onSubmit,
  isLoading,
  onCancel,
}) => {
  const form = useForm<AddBeneficiaryInput>({
    resolver: zodResolver(AddBeneficiaryRequestSchema),
    defaultValues: defaultValues || {
      beneficiary: { type: 'EXTERNAL' },
      bequestType: BequestType.PERCENTAGE,
      priority: BequestPriority.PRIMARY,
      conditions: [],
    },
  });

  const { fields,append, remove } = useFieldArray({
    control: form.control,
    name: 'conditions',
  });

  // Watch bequest type to conditionally render Amount vs Percentage fields
  const bequestType = form.watch('bequestType');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Who is the Beneficiary? */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">
            1. Beneficiary Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="beneficiary.externalName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="beneficiary.externalRelationship"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Sister, Son, Friend" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Section 2: What are they getting? */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">
            2. The Gift (Bequest)
          </h3>
          
          <FormField
            control={form.control}
            name="bequestType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type of Gift</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={BequestType.PERCENTAGE}>Percentage of Estate</SelectItem>
                    <SelectItem value={BequestType.FIXED_AMOUNT}>Fixed Cash Amount</SelectItem>
                    <SelectItem value={BequestType.SPECIFIC_ASSET}>Specific Asset</SelectItem>
                    <SelectItem value={BequestType.RESIDUARY}>Residuary (Everything Remaining)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe the gift clearly..." 
                    className="resize-none" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Conditional Fields based on Type */}
          {bequestType === BequestType.PERCENTAGE && (
            <FormField
              control={form.control}
              name="percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Percentage (%)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      max="100"
                      placeholder="e.g. 50" 
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))} 
                    />
                  </FormControl>
                  <FormDescription>Must be between 0.01 and 100.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {bequestType === BequestType.FIXED_AMOUNT && (
            <FormField
              control={form.control}
              name="fixedAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (KES)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="e.g. 100000" 
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Section 3: Conditions (Optional) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-semibold text-slate-900">
              3. Conditions (Optional)
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ type: BequestConditionType.AGE_REQUIREMENT, parameter: { type: 'AGE_REQUIREMENT', minimumAge: 18 } })}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Condition
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <Card key={field.id} className="bg-slate-50 border-slate-200">
                <CardContent className="p-3 flex items-center gap-3">
                  <Gift className="h-4 w-4 text-slate-400" />
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    {/* Condition Type Selector */}
                    <FormField
                        control={form.control}
                        name={`conditions.${index}.type`}
                        render={({ field }) => (
                        <FormItem className="space-y-0">
                            <Select 
                                onValueChange={(val) => {
                                    field.onChange(val);
                                    // Reset parameter based on type selection to avoid type mismatches
                                    if(val === 'AGE_REQUIREMENT') {
                                        form.setValue(`conditions.${index}.parameter`, { type: 'AGE_REQUIREMENT', minimumAge: 21 });
                                    } else if (val === 'SURVIVAL') {
                                        form.setValue(`conditions.${index}.parameter`, { type: 'SURVIVAL', mustSurviveDays: 30 });
                                    }
                                }} 
                                defaultValue={field.value}
                            >
                            <FormControl>
                                <SelectTrigger className="h-9">
                                <SelectValue />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="AGE_REQUIREMENT">Minimum Age</SelectItem>
                                <SelectItem value="SURVIVAL">Survival Period</SelectItem>
                            </SelectContent>
                            </Select>
                        </FormItem>
                        )}
                    />
                    
                    {/* Parameter Input - Simplified for demo (assumes AGE or SURVIVAL) */}
                    {form.watch(`conditions.${index}.type`) === 'AGE_REQUIREMENT' && (
                         <FormField
                            control={form.control}
                            name={`conditions.${index}.parameter.minimumAge`}
                            render={({ field }) => (
                                <Input 
                                    type="number" 
                                    placeholder="Age" 
                                    className="h-9" 
                                    {...field}
                                    onChange={e => field.onChange(parseInt(e.target.value))}
                                />
                            )}
                         />
                    )}
                     {form.watch(`conditions.${index}.type`) === 'SURVIVAL' && (
                         <FormField
                            control={form.control}
                            name={`conditions.${index}.parameter.mustSurviveDays`}
                            render={({ field }) => (
                                <Input 
                                    type="number" 
                                    placeholder="Days" 
                                    className="h-9" 
                                    {...field}
                                    onChange={e => field.onChange(parseInt(e.target.value))}
                                />
                            )}
                         />
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
            {fields.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No conditions added. The gift will be given immediately upon death.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
            {isLoading ? 'Saving...' : 'Save Beneficiary'}
          </Button>
        </div>
      </form>
    </Form>
  );
};