// FILE: src/features/families/components/CreateRelationshipForm.tsx

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Search, UserPlus } from 'lucide-react';

import {
  CreateRelationshipSchema,
  type CreateRelationshipInput,
  RelationshipTypeSchema,
} from '../../../types';
import { useCreateRelationship } from '../families.api';
import { useAdminUsers } from '../../admin/admin.api'; // Re-using admin user search for now
import { useAuthStore } from '../../../store/auth.store';
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
import { Avatar } from '../../../components/common/Avatar';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// TYPE DEFINITIONS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

interface CreateRelationshipFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
  existingMemberIds?: string[];
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

/**
 * A form for creating a relationship with an existing user on the platform.
 */
export function CreateRelationshipForm({
  onSuccess,
  onCancel,
  existingMemberIds = [],
}: CreateRelationshipFormProps) {
  const { t } = useTranslation(['families', 'common', 'validation']);
  const { mutate: createRelationship, isPending } = useCreateRelationship();
  const currentUser = useAuthStore((state) => state.user);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateRelationshipInput>({
    resolver: zodResolver(CreateRelationshipSchema),
    defaultValues: {
      targetUserId: undefined,
      relationshipType: undefined,
    },
  });

  // Debounce search input
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data: usersData, isLoading: isSearching } = useAdminUsers({
    search: debouncedSearch || undefined,
    limit: 10,
  });

  // Filter out the current user and existing members
  const availableUsers = React.useMemo(() => {
    const excludeIds = new Set([...existingMemberIds, currentUser?.id]);
    return usersData?.data.filter((user) => !excludeIds.has(user.id)) ?? [];
  }, [usersData, existingMemberIds, currentUser]);

  const onSubmit = (formData: CreateRelationshipInput) => {
    createRelationship(formData, {
      onSuccess: () => {
        toast.success(t('relationship_created_success'));
        onSuccess();
      },
      onError: (error) => {
        toast.error(t('relationship_created_failed'), {
          description: extractErrorMessage(error),
        });
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="search">{t('search_for_user')}</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search"
            placeholder={t('search_by_name_or_email')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetUserId">{t('select_person')}</Label>
        <Controller
          name="targetUserId"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
              <SelectTrigger id="targetUserId" aria-invalid={!!errors.targetUserId}>
                <SelectValue placeholder={t('select_person_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {isSearching && <div className="flex justify-center p-4"><LoadingSpinner /></div>}
                {!isSearching && availableUsers.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {debouncedSearch ? t('no_users_found') : t('start_typing_to_search')}
                  </div>
                ) : (
                  availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <Avatar fallback={`${user.firstName[0]}${user.lastName[0]}`} className="h-6 w-6" />
                        <span>{`${user.firstName} ${user.lastName}`}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        />
        {errors.targetUserId && <p className="text-sm text-destructive">{errors.targetUserId.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="relationshipType">{t('their_relationship_to_you')}</Label>
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
        {errors.relationshipType && <p className="text-sm text-destructive">{errors.relationshipType.message}</p>}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            {t('common:cancel')}
          </Button>
        )}
        <Button type="submit" isLoading={isPending}>
          <UserPlus className="mr-2 h-4 w-4" />
          {t('create_relationship')}
        </Button>
      </div>
    </form>
  );
}
