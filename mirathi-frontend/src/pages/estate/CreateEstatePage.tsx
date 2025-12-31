import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

import { 
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, 
  Input, Button, Separator 
} from '../../components/ui';
import { PageHeader } from '../../components/common';
import { useCreateEstate } from '../../features/estate/estate.api';
import { 
  CreateEstateRequestSchema, 
  type CreateEstateInput 
} from '../../types/estate.types';

export const CreateEstatePage: React.FC = () => {
  const navigate = useNavigate();
  
  const form = useForm<CreateEstateInput>({
    resolver: zodResolver(CreateEstateRequestSchema),
    defaultValues: {
      name: '',
      deceasedName: '',
      kraPin: '',
      initialCash: { amount: 0, currency: 'KES' },
      // executorId would typically come from the logged-in user context
      executorId: 'user-uuid-placeholder' 
    }
  });

  const { mutate, isPending } = useCreateEstate({
    onSuccess: (data) => {
      // Redirect to the dashboard of the new estate
      navigate(`/estates/${data.id}`);
    }
  });

  return (
    <div className="mx-auto max-w-2xl p-6">
      
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 pl-0 text-muted-foreground"
          onClick={() => navigate('/estates')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Registry
        </Button>
        <PageHeader 
          title="Initialize New Estate" 
          description="Create a digital ledger for assets, liabilities, and distribution."
        />
      </div>

      {/* Form Card */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutate(data))} className="space-y-6">
            
            {/* Section 1: Deceased Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Deceased Information</h3>
              <Separator />
              
              <FormField control={form.control} name="deceasedName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name of Deceased</FormLabel>
                  <FormControl><Input placeholder="e.g. The Late John Doe" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="dateOfDeath" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Death</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} onChange={(e) => field.onChange(new Date(e.target.value).toISOString())} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="kraPin" render={({ field }) => (
                  <FormItem>
                    <FormLabel>KRA PIN (Deceased)</FormLabel>
                    <FormControl><Input placeholder="A000..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* Section 2: Estate Details */}
            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-semibold text-slate-900">Estate Administration Details</h3>
              <Separator />

              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Estate Label (System Name)</FormLabel>
                  <FormControl><Input placeholder="e.g. Estate of John Doe (2025)" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="courtCaseNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>Succession Cause / Court Case No.</FormLabel>
                  <FormControl><Input placeholder="e.g. E123 of 2025" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Section 3: Financials */}
            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-semibold text-slate-900">Opening Balance</h3>
              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="initialCash.amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cash on Hand</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseFloat(e.target.value))} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="initialCash.currency" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl><Input disabled {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6">
              <Button type="submit" className="w-full" size="lg" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Ledger...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Create Estate Ledger
                  </>
                )}
              </Button>
            </div>

          </form>
        </Form>
      </div>
    </div>
  );
};