// FILE: src/features/families/components/InviteMemberForm.tsx

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Mail, UserPlus } from 'lucide-react';

import { InviteMemberSchema, type InviteMemberInput, RelationshipTypeSchema } from '../../../types';
import { useInviteMember } from '../families.api';
import { extractErrorMessage } from '../../../api/client';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/Select';
import { Alert, AlertDescription } from '../../../components/ui/Alert';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// TYPE DEFINITIONS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

interface InviteMemberFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

/**
 * A form for inviting a new member to the family tree via email.
 */
export function InviteMemberForm({ onSuccess, onCancel }: InviteMemberFormProps) {
  const { t } = useTranslation(['families', 'common', 'validation']);
  const { mutate: inviteMember, isPending } = useInviteMember();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<InviteMemberInput>({
    resolver: zodResolver(InviteMemberSchema),
    defaultValues: {
      inviteeEmail: '',
      relationshipType: undefined,
    },
  });

  const onSubmit = (formData: InviteMemberInput) => {
    inviteMember(formData, {
      onSuccess: () => {
        toast.success(t('invitation_sent_success_title'), {
          description: t('invitation_sent_success_description', { email: formData.inviteeEmail }),
        });
        onSuccess();
      },
      onError: (error) => {
        toast.error(t('invitation_sent_failed_title'), {
          description: extractErrorMessage(error),
        });
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Alert>
        <AlertDescription>{t('invite_member_info')}</AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="inviteeEmail">{t('invitee_email')}</Label>
        <Input
          id="inviteeEmail"
          type="email"
          placeholder="name@example.com"
          autoComplete="email"
          leftIcon={<Mail className="text-muted-foreground" size={16} />}
          disabled={isPending}
          aria-invalid={!!errors.inviteeEmail}
          aria-describedby="inviteeEmail-error"
          {...register('inviteeEmail')}
        />
        {errors.inviteeEmail && (
          <p id="inviteeEmail-error" className="text-sm text-destructive">
            {errors.inviteeEmail.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="relationshipType">{t('relationship_to_you')}</Label>
        <Controller
          name="relationshipType"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
              <SelectTrigger id="relationshipType" aria-invalid={!!errors.relationshipType}>
                <SelectValue placeholder={t('select_relationship_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {RelationshipTypeSchema.options.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`relationship_type_options.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.relationshipType && (
          <p className="text-sm text-destructive">{errors.relationshipType.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            {t('common:cancel')}
          </Button>
        )}
        <Button type="submit" isLoading={isPending}>
          <UserPlus className="mr-2 h-4 w-4" />
          {t('send_invitation')}
        </Button>
      </div>
    </form>
  );
}
