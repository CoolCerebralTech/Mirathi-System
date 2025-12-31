// FILE: src/features/family/components/KinshipLinks.tsx

import React from 'react';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Heart, 
  Users, 
  User,
  Activity
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Badge, ScrollArea } from '../../../components/ui';
import { 
  type FamilyMemberResponse} from '../../../types/family.types';

// ============================================================================
// PROPS
// ============================================================================

interface KinshipLinksProps {
  kinship: FamilyMemberResponse['kinship'];
  onNavigate?: (memberId: string) => void;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const KinshipLinks: React.FC<KinshipLinksProps> = ({
  kinship,
  onNavigate,
  className,
}) => {
  const hasParents = kinship.parents.length > 0;
  const hasSpouses = kinship.spouses.length > 0;
  const hasSiblings = kinship.siblings.length > 0;
  const hasChildren = kinship.children.length > 0;

  if (!hasParents && !hasSpouses && !hasSiblings && !hasChildren) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <Users className="mb-2 h-8 w-8 opacity-20" />
        <p className="text-sm">No relationships recorded yet.</p>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Helper Renderers
  // --------------------------------------------------------------------------

  const renderSection = (
    title: string, 
    icon: React.ReactNode, 
    content: React.ReactNode
  ) => (
    <div className="mb-6 last:mb-0">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        {icon}
        <span>{title}</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {content}
      </div>
    </div>
  );

  const LinkCard = ({ 
    id, 
    name, 
    meta, 
    subMeta,
    badge 
  }: { 
    id: string; 
    name: string; 
    meta?: string; 
    subMeta?: string;
    badge?: React.ReactNode 
  }) => (
    <div 
      onClick={() => onNavigate?.(id)}
      className={cn(
        "flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50",
        !onNavigate && "cursor-default"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <User className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium leading-none">{name}</span>
          {meta && <span className="mt-1 text-xs text-muted-foreground">{meta}</span>}
          {subMeta && <span className="text-[10px] text-muted-foreground italic">{subMeta}</span>}
        </div>
      </div>
      {badge}
    </div>
  );

  // --------------------------------------------------------------------------
  // Main Render
  // --------------------------------------------------------------------------

  return (
    <ScrollArea className={cn("h-full w-full pr-4", className)}>
      
      {/* 1. PARENTS */}
      {hasParents && renderSection(
        "Parents", 
        <ArrowUpCircle className="h-4 w-4" />,
        kinship.parents.map((p) => (
          <LinkCard 
            key={p.id} 
            id={p.id} 
            name={p.name} 
            meta={p.relationshipType.toLowerCase()}
            badge={
              !p.isAlive && (
                <Badge variant="secondary" className="text-[10px]">Deceased</Badge>
              )
            }
          />
        ))
      )}

      {/* 2. SPOUSES */}
      {hasSpouses && renderSection(
        "Spouses", 
        <Heart className="h-4 w-4" />,
        kinship.spouses.map((s) => (
          <LinkCard 
            key={s.id} 
            id={s.id} 
            name={s.name} 
            meta={s.marriageType.replace('_', ' ')}
            subMeta={s.dateOfMarriage ? `Since ${new Date(s.dateOfMarriage).getFullYear()}` : undefined}
            badge={
               <Badge variant="outline" className="text-[10px]">{s.status}</Badge>
            }
          />
        ))
      )}

      {/* 3. SIBLINGS */}
      {hasSiblings && renderSection(
        "Siblings", 
        <Activity className="h-4 w-4" />,
        kinship.siblings.map((s) => (
          <LinkCard 
            key={s.id} 
            id={s.id} 
            name={s.name} 
            meta={`${s.type} Sibling`}
          />
        ))
      )}

      {/* 4. CHILDREN */}
      {hasChildren && renderSection(
        "Children", 
        <ArrowDownCircle className="h-4 w-4" />,
        kinship.children.map((c) => (
          <LinkCard 
            key={c.id} 
            id={c.id} 
            name={c.name} 
            meta={`${c.gender} ${c.age ? `• ${c.age} yrs` : ''}`}
          />
        ))
      )}

    </ScrollArea>
  );
};