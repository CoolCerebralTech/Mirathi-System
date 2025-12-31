import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateCapacityRequestSchema, type UpdateCapacityInput } from '@/types/will.types';
import { CapacityStatus } from '@/types/will.types';
import { Button } from '@/components/ui';
import { Textarea } from '@/components/ui';
import { Checkbox } from '@/components/ui';
import {
  Form,
  FormControl,
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
import { BrainCircuit } from 'lucide-react';

interface CapacityDeclarationFormProps {
  onSubmit: (data: UpdateCapacityInput) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export const CapacityDeclarationForm: React.FC<CapacityDeclarationFormProps> = ({
  onSubmit,
  isLoading,
  onCancel,
}) => {
  const form = useForm<UpdateCapacityInput>({
    resolver: zodResolver(UpdateCapacityRequestSchema),
    defaultValues: {
      status: CapacityStatus.SELF_DECLARATION,
      date: new Date().toISOString(),
      documentIds: [], // Would handle file upload separately and pass IDs
      declarations: {
        isVoluntarilyMade: false,
        isFreeFromUndueInfluence: false
      }
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
             <div className="p-2 bg-indigo-100 rounded-full">
                 <BrainCircuit className="h-5 w-5 text-indigo-600" />
             </div>
             <div>
                 <h3 className="font-semibold text-slate-900">Mental Capacity Assessment</h3>
                 <p className="text-xs text-muted-foreground">Requirements under Section 5 LSA</p>
             </div>
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Basis of Capacity</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select basis" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={CapacityStatus.SELF_DECLARATION}>Self Declaration (Standard)</SelectItem>
                    <SelectItem value={CapacityStatus.MEDICAL_CERTIFICATION}>Medical Certification (Recommended for seniors)</SelectItem>
                    <SelectItem value={CapacityStatus.COURT_DETERMINATION}>Court Order</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="E.g. I am in good health, not taking medication that affects judgment..." 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-3 pt-4 border-t">
             <FormField
                control={form.control}
                name="declarations.isVoluntarilyMade"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>I am making this Will voluntarily.</FormLabel>
                        </div>
                    </FormItem>
                )}
             />
             <FormField
                control={form.control}
                name="declarations.isFreeFromUndueInfluence"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>I am free from undue influence or coercion.</FormLabel>
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
          <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
            {isLoading ? 'Updating...' : 'Confirm Capacity'}
          </Button>
        </div>
      </form>
    </Form>
  );
};