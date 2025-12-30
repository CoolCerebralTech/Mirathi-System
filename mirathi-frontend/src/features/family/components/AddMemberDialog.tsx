import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, UserPlus } from 'lucide-react';

import { Button } from '../../../components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/Dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../../components/ui/Form';
import { Input } from '../../../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

import { AddFamilyMemberRequestSchema, Gender, RelationshipType } from '../family.types';
import { useAddMember } from '../family.api';

interface AddMemberDialogProps {
  familyId: string;
  anchorMemberId?: string; // If adding a relative TO someone specific
  anchorMemberName?: string;
}

export function AddMemberDialog({ familyId, anchorMemberId, anchorMemberName }: AddMemberDialogProps) {
  const [open, setOpen] = React.useState(false);
  
  const { mutate: addMember, isPending } = useAddMember(familyId, {
    onSuccess: () => {
      setOpen(false);
      form.reset();
    }
  });

  const form = useForm({
    resolver: zodResolver(AddFamilyMemberRequestSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      gender: undefined,
      relationshipToRelative: undefined,
      relativeId: anchorMemberId || '',
      dateOfBirth: '',
      dateOfBirthEstimated: false,
    },
  });

  // Watchers to adjust UI based on relationship type
  const relationship = form.watch('relationshipToRelative');

  const onSubmit = (data: any) => {
    // Clean up empty date strings to prevent backend errors
    if (!data.dateOfBirth) delete data.dateOfBirth;
    addMember(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={anchorMemberId ? "outline" : "default"}>
          {anchorMemberId ? <UserPlus className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          {anchorMemberId ? `Add Relative` : 'Add Member'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {anchorMemberId && anchorMemberName 
              ? `Add Relative for ${anchorMemberName}` 
              : 'Add New Family Member'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Identity Fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {Object.values(Gender).map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Relationship Context (Only if anchor exists) */}
            {anchorMemberId && (
              <div className="p-3 bg-muted/50 rounded-md space-y-3">
                <FormLabel className="text-xs uppercase text-muted-foreground font-bold">Connection</FormLabel>
                <FormField
                  control={form.control}
                  name="relationshipToRelative"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>This new person is the...</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Relationship" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(RelationshipType).map((rel) => (
                            <SelectItem key={rel} value={rel}>
                              {rel} {anchorMemberName ? `of ${anchorMemberName}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Hidden Field for the ID */}
                <input type="hidden" {...form.register('relativeId')} />
              </div>
            )}

            {/* Vital Info */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateOfBirthEstimated"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Estimated?</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Adding Member...' : 'Save Member'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}