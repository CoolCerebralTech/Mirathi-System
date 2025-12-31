import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddWitnessRequestSchema, type AddWitnessInput } from '@/types/will.types';
import { WitnessType } from '@/types/will.types';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
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

interface WitnessFormProps {
  onSubmit: (data: AddWitnessInput) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export const WitnessForm: React.FC<WitnessFormProps> = ({
  onSubmit,
  isLoading,
  onCancel,
}) => {
  const form = useForm<AddWitnessInput>({
    resolver: zodResolver(AddWitnessRequestSchema),
    defaultValues: {
      witnessIdentity: { type: WitnessType.EXTERNAL_INDIVIDUAL },
      eligibilityConfirmation: {
        isOver18: false,
        isMentallyCompetent: false,
        isNotBeneficiary: false
      }
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
            {/* Identity */}
            <FormField
            control={form.control}
            name="witnessIdentity.externalFullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Witness Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Mary Wanjiku" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="witnessIdentity.externalNationalId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>National ID</FormLabel>
                        <FormControl>
                        <Input placeholder="ID Number" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="contactInfo.phone"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                        <Input placeholder="For notification" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
           </div>

           <FormField
            control={form.control}
            name="witnessIdentity.type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Witness Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={WitnessType.EXTERNAL_INDIVIDUAL}>Friend / Relative</SelectItem>
                    <SelectItem value={WitnessType.PROFESSIONAL_WITNESS}>Lawyer / Doctor</SelectItem>
                    <SelectItem value={WitnessType.NOTARY_PUBLIC}>Notary Public</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Eligibility Checkboxes (Critical for S.13) */}
          <div className="space-y-3 pt-2 border-t">
            <h4 className="text-sm font-semibold text-slate-900">Eligibility Confirmation</h4>
            <FormField
                control={form.control}
                name="eligibilityConfirmation.isOver18"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>Is over 18 years old?</FormLabel>
                        </div>
                    </FormItem>
                )}
             />
             <FormField
                control={form.control}
                name="eligibilityConfirmation.isMentallyCompetent"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>Is of sound mind?</FormLabel>
                        </div>
                    </FormItem>
                )}
             />
             <FormField
                control={form.control}
                name="eligibilityConfirmation.isNotBeneficiary"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel className="text-red-700 font-bold">Is NOT a beneficiary in this Will?</FormLabel>
                            <FormDescription>
                                Warning: If a witness is also a beneficiary, their gift will be voided by court (S.13 LSA).
                            </FormDescription>
                        </div>
                    </FormItem>
                )}
             />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Nominate Witness'}
          </Button>
        </div>
      </form>
    </Form>
  );
};