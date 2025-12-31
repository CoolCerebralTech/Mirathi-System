// FILE: src/features/documents/components/DocumentCategoryFilter.tsx

import React from 'react';
import { 
  LayoutGrid, 
  Map, 
  UserSquare2, 
  Scale, 
  Banknote, 
  FileBox 
} from 'lucide-react';

import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui';
import { 
  DocumentCategoryEnum, 
  type DocumentCategory 
} from '../../../types/document.types';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Mapping Enums to Friendly Labels & Icons
const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  ALL: { 
    label: 'All Documents', 
    icon: <LayoutGrid className="mr-2 h-4 w-4" /> 
  },
  [DocumentCategoryEnum.enum.LAND_OWNERSHIP]: { 
    label: 'Land & Property', 
    icon: <Map className="mr-2 h-4 w-4" /> 
  },
  [DocumentCategoryEnum.enum.IDENTITY_PROOF]: { 
    label: 'Identity Proofs', 
    icon: <UserSquare2 className="mr-2 h-4 w-4" /> 
  },
  [DocumentCategoryEnum.enum.SUCCESSION_DOCUMENT]: { 
    label: 'Legal & Court', 
    icon: <Scale className="mr-2 h-4 w-4" /> 
  },
  [DocumentCategoryEnum.enum.FINANCIAL_PROOF]: { 
    label: 'Finance & Bank', 
    icon: <Banknote className="mr-2 h-4 w-4" /> 
  },
  [DocumentCategoryEnum.enum.OTHER]: { 
    label: 'Others', 
    icon: <FileBox className="mr-2 h-4 w-4" /> 
  },
};

// ============================================================================
// PROPS
// ============================================================================

interface DocumentCategoryFilterProps {
  /**
   * The currently selected category (null means 'All')
   */
  selectedCategory: DocumentCategory | null;

  /**
   * Callback to change selection
   */
  onSelect: (category: DocumentCategory | null) => void;

  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const DocumentCategoryFilter: React.FC<DocumentCategoryFilterProps> = ({
  selectedCategory,
  onSelect,
  className,
}) => {
  return (
    <div className={cn("w-full overflow-x-auto pb-2 scrollbar-none", className)}>
      <div className="flex w-max space-x-2">
        
        {/* 'ALL' Button */}
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect(null)}
          className={cn(
            "rounded-full transition-all",
            selectedCategory === null && "shadow-sm"
          )}
        >
          {CATEGORY_CONFIG.ALL.icon}
          {CATEGORY_CONFIG.ALL.label}
        </Button>

        {/* Dynamic Enum Buttons */}
        {Object.values(DocumentCategoryEnum.enum).map((category) => {
          const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.ALL;
          const isSelected = selectedCategory === category;

          return (
            <Button
              key={category}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onSelect(category)}
              className={cn(
                "rounded-full transition-all",
                isSelected && "shadow-sm"
              )}
            >
              {config.icon}
              {config.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
};