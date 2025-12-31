import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddCodicilRequestSchema, type AddCodicilInput } from '@/types/will.types';
import { CodicilAmendmentType } from '@/types/will.types';
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

interface CodicilFormProps {
  onSubmit: (data: AddCodicilInput) => void;
  isLoading?: boolean;
  onCancel?: () => void;
  existingClauseReferences?: string[]; // Optional helper to autocomplete clauses
}

export const CodicilForm: React.FC<CodicilFormProps> = ({
  onSubmit,
  isLoading,
  onCancel,
}) => {
  const form = useForm<AddCodicilInput>({
    resolver: zodResolver(AddCodicilRequestSchema),
    defaultValues: {
      amendmentType: CodicilAmendmentType.MODIFICATION,
      date: new Date().toISOString(),
      affectedClauses: [],
      // Default execution details needed by schema, though UI might hide them in drafting phase
      executionDetails: {
          date: new Date().toISOString(),
          location: 'Pending',
          witnessesPresent: 2
      },
      witnessIds: ['00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'] // Placeholders for draft
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amendment Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. First Codicil to my Will regarding Car" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amendmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type of Change</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={CodicilAmendmentType.ADDITION}>Addition (Adding a new gift)</SelectItem>
                    <SelectItem value={CodicilAmendmentType.MODIFICATION}>Modification (Changing an existing gift)</SelectItem>
                    <SelectItem value={CodicilAmendmentType.REVOCATION}>Revocation (Removing a gift)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Legal Text</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="I hereby amend clause X to read as follows..." 
                    className="min-h-[200px] font-mono text-sm bg-slate-50"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                    State clearly which clause is being changed and what the new wording is.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
             <h4 className="text-sm font-semibold text-blue-900 mb-2">Execution Note</h4>
             <p className="text-xs text-blue-800">
                 A Codicil must be signed and witnessed with the <strong>same formalities</strong> as the original Will (S.11 LSA). You will need to perform the execution ceremony again for this amendment to be valid.
             </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Draft Codicil'}
          </Button>
        </div>
      </form>
    </Form>
  );
};