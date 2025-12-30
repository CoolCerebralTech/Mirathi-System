import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2, ArrowRight } from 'lucide-react';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../../components/ui/Form';

import { CreateFamilyRequestSchema, KenyanCounty, Gender } from '../../../types';
import { useCreateFamily } from '../family.api';

interface CreateFamilyFormProps {
  onSuccess: (familyId: string) => void;
}

export function CreateFamilyForm({ onSuccess }: CreateFamilyFormProps) {
  const { t } = useTranslation(['families', 'common']);
  
  const { mutate: createFamily, isPending } = useCreateFamily({
    onSuccess: (data) => onSuccess(data.id),
  });

  const form = useForm({
    resolver: zodResolver(CreateFamilyRequestSchema),
    defaultValues: {
      familyName: '',
      description: '',
      homeCounty: undefined,
      creatorProfile: {
        firstName: '',
        lastName: '',
        gender: undefined,
        nationalId: '',
      }
    },
  });

  const onSubmit = (data: any) => createFamily(data);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Family Details</h3>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="familyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Family Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. The Omondi Family" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="homeCounty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Home County</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select County" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(KenyanCounty).map((county) => (
                        <SelectItem key={county} value={county}>
                          {county.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description / History (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Brief history or description of the family lineage..." 
                    className="resize-none" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Your Profile in Tree</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="creatorProfile.firstName"
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
              name="creatorProfile.lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="creatorProfile.gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(Gender).map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="creatorProfile.nationalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>National ID</FormLabel>
                  <FormControl><Input placeholder="Optional at this stage" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Registry...</>
          ) : (
            <><ArrowRight className="mr-2 h-4 w-4" /> Start Family Registry</>
          )}
        </Button>
      </form>
    </Form>
  );
}