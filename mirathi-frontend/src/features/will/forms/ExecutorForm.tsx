import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppointExecutorRequestSchema, type AppointExecutorInput } from '@/types/will.types';
import { ExecutorPriorityType } from '@/types/will.types';
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
import { Alert, AlertDescription } from '@/components/ui';
import { AlertCircle } from 'lucide-react';

interface ExecutorFormProps {
  defaultValues?: Partial<AppointExecutorInput>;
  onSubmit: (data: AppointExecutorInput) => void;
  isLoading?: boolean;
  onCancel?: () => void;
  existingExecutorsCount?: number;
}

export const ExecutorForm: React.FC<ExecutorFormProps> = ({
  defaultValues,
  onSubmit,
  isLoading,
  onCancel,
  existingExecutorsCount = 0,
}) => {
  const form = useForm<AppointExecutorInput>({
    resolver: zodResolver(AppointExecutorRequestSchema),
    defaultValues: defaultValues || {
      executorIdentity: { type: 'EXTERNAL' },
      priority: existingExecutorsCount === 0 ? ExecutorPriorityType.PRIMARY : ExecutorPriorityType.SUBSTITUTE,
      compensation: { isEntitled: false },
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="executorIdentity.fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. John Kamau" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="executorIdentity.externalEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="executorIdentity.externalPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+254..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role & Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={ExecutorPriorityType.PRIMARY}>Primary Executor (Main Decision Maker)</SelectItem>
                    <SelectItem value={ExecutorPriorityType.CO_EXECUTOR}>Co-Executor (Joint Authority)</SelectItem>
                    <SelectItem value={ExecutorPriorityType.SUBSTITUTE}>Substitute (Back-up only)</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                    Primary executors act immediately. Substitutes only act if the Primary is unable.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="rounded-lg border p-4 bg-slate-50">
             <FormField
                control={form.control}
                name="compensation.isEntitled"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                            <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>
                                Entitled to Compensation?
                            </FormLabel>
                            <FormDescription>
                                Should this executor be paid from the estate for their work? (Usually 5% of assets).
                            </FormDescription>
                        </div>
                    </FormItem>
                )}
             />
          </div>

          {form.watch('compensation.isEntitled') && (
             <Alert className="bg-blue-50 text-blue-900 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                   Note: The Law of Succession Act allows for reasonable remuneration, but specifying it here avoids disputes later.
                </AlertDescription>
             </Alert>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Appointing...' : 'Appoint Executor'}
          </Button>
        </div>
      </form>
    </Form>
  );
};