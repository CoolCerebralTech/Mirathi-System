import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Home } from 'lucide-react';

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
  Button,
} from '../../../components/ui';

import { useEstablishHouse } from '../family.api';
import {
  EstablishPolygamousHouseRequestSchema,
  type EstablishPolygamousHouseInput,
  type FamilyMemberResponse,
} from '../../../types/family.types';

interface EstablishHouseFormProps {
  familyId: string;
  members: FamilyMemberResponse[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const EstablishHouseForm: React.FC<EstablishHouseFormProps> = ({
  familyId,
  members,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<EstablishPolygamousHouseInput>({
    resolver: zodResolver(EstablishPolygamousHouseRequestSchema),
    defaultValues: {
      houseOrder: 1,
      distributionWeight: 1.0,
      establishmentType: 'CUSTOMARY',
      residentialCounty: 'NAIROBI',
    },
  });

  const { mutate, isPending } = useEstablishHouse(familyId, {
    onSuccess: () => {
      form.reset();
      onSuccess?.();
    },
  });

  const onSubmit = (data: EstablishPolygamousHouseInput) => {
    mutate(data);
  };

  // Filter for female members typically (though not strictly enforced by code, logical for UX)
  const potentialWives = members.filter(m => m.identity.gender === 'FEMALE');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        <div className="flex items-center gap-2 rounded-md bg-purple-50 p-3 text-purple-900">
            <Home className="h-5 w-5" />
            <p className="text-sm">Creating a House organizes assets according to Section 40 (Polygamy).</p>
        </div>

        <FormField
            control={form.control}
            name="originalWifeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Matriarch (Head of House)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Wife" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {potentialWives.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.identity.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
        />

        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="houseName"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>House Name</FormLabel>
                    <FormControl>
                    <Input placeholder="e.g. The First House" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="houseOrder"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>House Order</FormLabel>
                    <FormControl>
                    <Input type="number" min={1} {...field} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Establish House
          </Button>
        </div>
      </form>
    </Form>
  );
};