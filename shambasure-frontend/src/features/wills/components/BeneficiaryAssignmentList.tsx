// FILE: src/features/wills/components/BeneficiaryAssignmentList.tsx

import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFieldArrayRemove,
} from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Trash2, Percent } from 'lucide-react';

import type { Will, UpdateWillContentsInput, Asset, User } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Avatar } from '../../../components/common/Avatar';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/Select';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// TYPE DEFINITIONS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

interface BeneficiaryAssignmentListProps {
  will: Will;
  isEditable?: boolean;
  // Props required only when isEditable is true
  control?: Control<UpdateWillContentsInput>;
  register?: UseFormRegister<UpdateWillContentsInput>;
  remove?: UseFieldArrayRemove;
  errors?: FieldErrors<UpdateWillContentsInput>;
  availableAssets?: Asset[];
  availableHeirs?: User[];
  disabled?: boolean;
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// HELPER
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const getInitials = (firstName = '', lastName = ''): string =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

/**
 * A component to display or edit a list of beneficiary assignments.
 * Operates in two modes: read-only display or as an editable field array within a form.
 */
export function BeneficiaryAssignmentList({
  will,
  isEditable = false,
  control,
  register,
  remove,
  errors,
  availableAssets = [],
  availableHeirs = [],
  disabled = false,
}: BeneficiaryAssignmentListProps) {
  const { t } = useTranslation(['wills', 'common']);

  if (!will.assignments || will.assignments.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-4">
        {t('no_assignments_yet')}
      </div>
    );
  }

  // --- EDITABLE MODE (for use inside WillForm) ---
  if (isEditable && control && register && remove) {
    return (
      <div className="space-y-4">
        {will.assignments.map((_, index) => (
          <div key={index} className="relative rounded-lg border bg-background p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Asset Select */}
              <div className="space-y-2">
                <Label>{t('asset')}</Label>
                <Controller
                  name={`assignments.${index}.assetId`}
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
                      <SelectTrigger><SelectValue placeholder={t('select_asset_placeholder')} /></SelectTrigger>
                      <SelectContent>
                        {availableAssets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              {/* Beneficiary Select */}
              <div className="space-y-2">
                <Label>{t('beneficiary')}</Label>
                <Controller
                  name={`assignments.${index}.beneficiaryId`}
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
                      <SelectTrigger><SelectValue placeholder={t('select_beneficiary_placeholder')} /></SelectTrigger>
                      <SelectContent>
                        {availableHeirs.map((heir) => (
                          <SelectItem key={heir.id} value={heir.id}>{`${heir.firstName} ${heir.lastName}`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            {/* Share Percentage Input */}
            <div className="mt-4">
              <Label>{t('share_percentage')}</Label>
              <div className="relative">
                <Input
                  type="number"
                  min="0.01" max="100" step="0.01"
                  className="pl-7"
                  disabled={disabled}
                  {...register(`assignments.${index}.sharePercentage`, { valueAsNumber: true })}
                />
                <Percent className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
              {errors?.assignments?.[index]?.sharePercentage && (
                  <p className="text-sm text-destructive mt-1">{errors.assignments[index]?.sharePercentage?.message}</p>
              )}
            </div>
            {/* Remove Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => remove(index)}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">{t('remove_assignment')}</span>
            </Button>
          </div>
        ))}
      </div>
    );
  }

  // --- READ-ONLY MODE ---
  return (
    <div className="space-y-3">
      
      {will.assignments.map((assignment) => {
        const beneficiary = assignment.beneficiary;
        const asset = assignment.asset;
        if (!beneficiary || !asset) return null;

        return (
          <div key={assignment.id} className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <Avatar
                src={undefined}
                alt={`${beneficiary.firstName} ${beneficiary.lastName}`}
                fallback={getInitials(beneficiary.firstName, beneficiary.lastName)}
                className="h-9 w-9"
              />
              <div>
                <p className="font-medium">
                  {beneficiary.firstName} {beneficiary.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('receives_asset', { assetName: asset.name })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">{assignment.sharePercentage}%</p>
              <p className="text-xs text-muted-foreground">{t('share')}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}