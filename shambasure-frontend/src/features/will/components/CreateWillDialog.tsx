import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ScrollText, BrainCircuit } from 'lucide-react';

import { Button } from '../../../components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../../../components/ui/Dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '../../../components/ui/Form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';

import { CreateDraftWillRequestSchema, WillType, CapacityStatus } from '../will.types';
import { useCreateDraftWill } from '../will.api';

export function CreateWillDialog() {
  const [open, setOpen] = React.useState(false);
  const { mutate, isPending } = useCreateDraftWill({
    onSuccess: () => setOpen(false)
  });

  const form = useForm({
    resolver: zodResolver(CreateDraftWillRequestSchema),
    defaultValues: {
      type: 'STANDARD',
      initialCapacityDeclaration: {
        status: 'SELF_DECLARATION',
        date: new Date().toISOString(),
        notes: ''
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <ScrollText className="h-4 w-4" /> Start My Will
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Digital Will</DialogTitle>
          <DialogDescription>
             This document will become your legal Last Will and Testament upon execution.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutate(d))} className="space-y-4">
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Will Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="STANDARD">Standard (Written)</SelectItem>
                      <SelectItem value="ISLAMIC">Islamic (Wasiyah)</SelectItem>
                      <SelectItem value="CUSTOMARY">Customary</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <div className="bg-blue-50 p-3 rounded-md border border-blue-100 space-y-3">
               <div className="flex items-center gap-2 text-blue-800">
                 <BrainCircuit className="h-4 w-4" />
                 <h4 className="font-semibold text-sm">Capacity Declaration</h4>
               </div>
               
               <FormField
                control={form.control}
                name="initialCapacityDeclaration.status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Basis of Capacity</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="SELF_DECLARATION">I declare I am of sound mind</SelectItem>
                        <SelectItem value="MEDICAL_CERTIFICATION">I have a doctor's report</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

               <FormField
                control={form.control}
                name="initialCapacityDeclaration.notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Notes (Optional)</FormLabel>
                    <FormControl><Textarea className="h-16 text-xs" placeholder="e.g. Taking medication but fully lucid..." {...field} /></FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Drafting...' : 'Create Draft'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}