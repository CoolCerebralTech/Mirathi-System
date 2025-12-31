import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button
} from '../../../components/ui';

import { useCreateFamily } from '../family.api';
import { 
  CreateFamilyRequestSchema, 
  type CreateFamilyInput, 
  Gender,
  KenyanCounty
} from '../../../types/family.types';

interface CreateFamilyFormProps {
  onSuccess: (familyId: string) => void;
}

export const CreateFamilyForm: React.FC<CreateFamilyFormProps> = ({ onSuccess }) => {
  const form = useForm<CreateFamilyInput>({
    resolver: zodResolver(CreateFamilyRequestSchema),
    defaultValues: {
      familyName: '',
      creatorProfile: {
        firstName: '',
        lastName: '',
        gender: 'MALE',
      },
      homeCounty: 'NAIROBI',
    },
  });

  const { mutate, isPending } = useCreateFamily({
    onSuccess: (data) => onSuccess(data.id),
  });

  const onSubmit = (data: CreateFamilyInput) => {
    mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Deceased Details</h3>
          <FormField
            control={form.control}
            name="familyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Family Name (e.g. The late John Doe)</FormLabel>
                <FormControl>
                  <Input placeholder="The Estate of..." {...field} />
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
                      <SelectValue placeholder="Select county" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-[200px]">
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

        <div className="space-y-4 rounded-md bg-muted/50 p-4">
          <h3 className="text-lg font-medium">Your Details (Administrator)</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="creatorProfile.firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
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
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
              control={form.control}
              name="creatorProfile.gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={Gender.MALE}>Male</SelectItem>
                      <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Initialize Succession Plan
        </Button>
      </form>
    </Form>
  );
};