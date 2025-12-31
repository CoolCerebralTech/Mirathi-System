import React from 'react';
import { Checkbox } from '@/components/ui';
import { Label } from '@/components/ui';
import { Card } from '@/components/ui';

export interface DeclarationState {
  isNotBeneficiary: boolean;
  isNotSpouseOfBeneficiary: boolean;
  isOfSoundMind: boolean;
  understandsDocument: boolean;
  isActingVoluntarily: boolean;
}

interface DeclarationChecklistProps {
  value: DeclarationState;
  onChange: (value: DeclarationState) => void;
  className?: string;
}

export const DeclarationChecklist: React.FC<DeclarationChecklistProps> = ({ 
  value, 
  onChange,
  className 
}) => {
  const handleToggle = (key: keyof DeclarationState) => {
    onChange({
      ...value,
      [key]: !value[key]
    });
  };

  const items = [
    {
      id: 'isOfSoundMind',
      label: 'Sound Mind',
      description: 'I confirm the Testator appears to be of sound mind and understands what they are doing.'
    },
    {
      id: 'understandsDocument',
      label: 'Understanding',
      description: 'I confirm the Testator knows this document is their Will.'
    },
    {
      id: 'isActingVoluntarily',
      label: 'Voluntary Action',
      description: 'The Testator is signing this voluntarily, without any pressure or undue influence.'
    },
    {
      id: 'isNotBeneficiary',
      label: 'Not a Beneficiary',
      description: 'I am NOT receiving any gift, money, or property in this Will. (S.13(2) LSA)'
    },
    {
      id: 'isNotSpouseOfBeneficiary',
      label: 'Not a Spouse of Beneficiary',
      description: 'My spouse is NOT receiving any gift in this Will.'
    }
  ];

  return (
    <div className={`space-y-3 ${className || ''}`}>
      {items.map((item) => (
        <Card key={item.id} className="p-4 border-slate-200 shadow-sm">
          <div className="flex items-start space-x-3">
            <Checkbox 
              id={item.id} 
              checked={value[item.id as keyof DeclarationState]}
              onCheckedChange={() => handleToggle(item.id as keyof DeclarationState)}
              className="mt-1"
            />
            <div className="space-y-1 leading-none">
              <Label 
                htmlFor={item.id}
                className="text-sm font-semibold text-slate-900 cursor-pointer"
              >
                {item.label}
              </Label>
              <p className="text-xs text-muted-foreground leading-normal">
                {item.description}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};