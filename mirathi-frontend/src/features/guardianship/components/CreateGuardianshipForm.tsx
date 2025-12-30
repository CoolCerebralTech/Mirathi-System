import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Gavel, User, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/Select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '../../../components/ui/Form';
import { Checkbox } from '../../../components/ui/Checkbox';
import { Textarea } from '../../../components/ui/Textarea';
import { Card, CardContent } from '../../../components/ui/Card';

import { CreateGuardianshipRequestSchema, LegalGuardianshipType, Gender } from '../guardianship.types';
import { useCreateGuardianship } from '../guardianship.api';

interface CreateGuardianshipFormProps {
  wardId: string; // Passed from Family Tree context
  wardName: string; // For display
  onSuccess?: () => void;
}

export function CreateGuardianshipForm({ wardId, wardName, onSuccess }: CreateGuardianshipFormProps) {
  const { t } = useTranslation();
  const { mutate: createCase, isPending } = useCreateGuardianship({ onSuccess });

  const form = useForm({
    resolver: zodResolver(CreateGuardianshipRequestSchema),
    defaultValues: {
      wardId: wardId,
      wardFirstName: wardName.split(' ')[0] || '',
      wardLastName: wardName.split(' ').slice(1).join(' ') || '',
      wardGender: undefined,
      wardIsAlive: true,
      wardDateOfBirth: '', // ISO Date string
      guardianshipType: 'FULL',
      jurisdiction: 'STATUTORY',
      requiresPropertyManagement: false,
      legalNotes: '',
      courtOrder: {
        caseNumber: '',
        courtStation: '',
        orderDate: '',
      }
    },
  });

  const onSubmit = (data: any) => {
    // If no court order data entered, remove the object to avoid validation errors if optional
    if (!data.courtOrder?.caseNumber) delete data.courtOrder;
    createCase(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        <div className="bg-blue-50 p-4 rounded-md flex items-start gap-3 border border-blue-100">
          <User className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900">Ward: {wardName}</h4>
            <p className="text-sm text-blue-700">Opening a legal guardianship file for this minor.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="wardDateOfBirth"
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
            name="wardGender"
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
        </div>

        <div className="space-y-4">
           <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
             <Gavel className="h-4 w-4" /> Legal Context
           </h3>
           
           <FormField
              control={form.control}
              name="guardianshipType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type of Guardianship</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {Object.values(LegalGuardianshipType).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormDescription>Determines the scope of legal authority.</FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requiresPropertyManagement"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Requires Property Management?</FormLabel>
                    <FormDescription>
                      Check if the ward has inheritance, land, or assets that need managing.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
        </div>

        {/* Court Order Section */}
        <Card>
          <CardContent className="pt-6 space-y-4">
             <h4 className="font-medium mb-2">Court Order Details (If applicable)</h4>
             <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="courtOrder.caseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Case Number</FormLabel>
                      <FormControl><Input placeholder="e.g. ELC 123 of 2024" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="courtOrder.courtStation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Court Station</FormLabel>
                      <FormControl><Input placeholder="e.g. Milimani" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="courtOrder.orderDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Order</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
             </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Opening File...' : 'Create Guardianship Case'}
        </Button>
      </form>
    </Form>
  );
}