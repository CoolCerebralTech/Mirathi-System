// FILE: src/features/families/components/AddFamilyMemberForm.tsx

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';

import { 
  AddFamilyMemberSchema, 
  type AddFamilyMemberInput,
  type RelationshipType 
} from '../../../types';
import { useAddFamilyMember } from '../families.api';
import { useUsers } from '../../../features/user/user.api';
import { toast } from '../../../components/common/Toaster';
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
import { Avatar } from '../../../components/common/Avatar';
import { Badge } from '../../../components/ui/Badge';

// ============================================================================
// CONSTANTS
// ============================================================================

const RELATIONSHIP_TYPES: Array<{ value: RelationshipType; label: string; icon: string }> = [
  { value: 'SPOUSE', label: 'Spouse', icon: '💑' },
  { value: 'CHILD', label: 'Child', icon: '👶' },
  { value: 'PARENT', label: 'Parent', icon: '👨' },
  { value: 'SIBLING', label: 'Sibling', icon: '👫' },
  { value: 'OTHER', label: 'Other', icon: '👤' },
];

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface AddFamilyMemberFormProps {
  familyId: string;
  existingMemberIds?: string[];
  onSuccess: () => void;
  onCancel?: () => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

// ============================================================================
// COMPONENT
// ============================================================================

export function AddFamilyMemberForm({ 
  familyId, 
  existingMemberIds = [],
  onSuccess, 
  onCancel 
}: AddFamilyMemberFormProps) {
  const { t } = useTranslation(['families', 'common']);
  const addMemberMutation = useAddFamilyMember();

  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Fetch users for selection
  const { data: usersData, isLoading: usersLoading } = useUsers({
    search: searchQuery || undefined,
    page: 1,
    limit: 20,
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AddFamilyMemberInput>({
    resolver: zodResolver(AddFamilyMemberSchema),
  });

  const selectedUserId = watch('userId');
  const selectedRelationship = watch('role');

  // Filter out existing members
  const availableUsers = usersData?.data.filter(
    user => !existingMemberIds.includes(user.id)
  ) || [];

  const selectedUser = availableUsers.find(u => u.id === selectedUserId);
  const relationshipInfo = RELATIONSHIP_TYPES.find(r => r.value === selectedRelationship);

  const onSubmit = (data: AddFamilyMemberInput) => {
    addMemberMutation.mutate(
      { familyId, data },
      {
        onSuccess: () => {
          toast.success(t('families:member_added_success'));
          onSuccess();
        },
        onError: (error) => {
          toast.error(t('common:error'), extractErrorMessage(error));
        },
      }
    );
  };

  const isLoading = usersLoading || addMemberMutation.isPending;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Information Alert */}
      <Alert>
        <AlertDescription>
          {t('families:add_member_info')}
        </AlertDescription>
      </Alert>

      {/* Search Users */}
      <div className="space-y-2">
        <Label htmlFor="search">{t('families:search_users')}</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search"
            placeholder={t('families:search_users_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Select User */}
      <div className="space-y-2">
        <Label htmlFor="userId">
          {t('families:select_user')} <span className="text-destructive">*</span>
        </Label>
        <Controller
          name="userId"
          control={control}
          render={({ field }) => (
            <Select 
              value={field.value} 
              onValueChange={field.onChange}
              disabled={isLoading}
            >
              <SelectTrigger id="userId">
                <SelectValue placeholder={t('families:choose_user_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {t('families:no_users_found')}
                  </div>
                ) : (
                  availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={undefined}
                          alt={`${user.firstName} ${user.lastName}`}
                          fallback={getInitials(user.firstName, user.lastName)}
                          className="h-6 w-6"
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        />
        {errors.userId && (
          <p className="text-sm text-destructive">{errors.userId.message}</p>
        )}
      </div>

      {/* Select Relationship */}
      <div className="space-y-2">
        <Label htmlFor="role">
          {t('families:relationship')} <span className="text-destructive">*</span>
        </Label>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <Select 
              value={field.value} 
              onValueChange={field.onChange}
              disabled={isLoading}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder={t('families:choose_relationship_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <span className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.role && (
          <p className="text-sm text-destructive">{errors.role.message}</p>
        )}
      </div>

      {/* Preview */}
      {selectedUser && relationshipInfo && (
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium mb-2">{t('families:preview')}</p>
          <div className="flex items-center gap-3">
            <Avatar
              src={undefined}
              alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
              fallback={getInitials(selectedUser.firstName, selectedUser.lastName)}
              className="h-10 w-10"
            />
            <div className="flex-1">
              <p className="font-medium">
                {selectedUser.firstName} {selectedUser.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
            </div>
            <Badge variant="outline">
              <span className="mr-1">{relationshipInfo.icon}</span>
              {relationshipInfo.label}
            </Badge>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {t('common:cancel')}
          </Button>
        )}
        <Button 
          type="submit" 
          isLoading={isLoading} 
          disabled={isLoading}
        >
          {t('families:add_member')}
        </Button>
      </div>
    </form>
  );
}