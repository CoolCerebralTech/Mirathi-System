// FILE: src/features/family/components/LegalStatusBadge.tsx

import React from 'react';
import { 
  Shield, 
  AlertTriangle, 
  UserCheck, 
  Baby,
  Users,
  Clock,
  Scale,
  BookOpen,
  UserX,
  CheckCircle2,
  XCircle,
  AlertCircle} from 'lucide-react';
import { Badge, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui';
import { cn } from '@/lib/utils';
import { type LegalStatus } from '@/types/family.types';

// ============================================================================
// PROPS & TYPES
// ============================================================================

interface LegalStatusBadgeProps {
  status: LegalStatus;
  /**
   * Member's age (optional, for more precise tooltips)
   */
  age?: number;
  /**
   * Is this member in a polygamous marriage?
   */
  isPolygamous?: boolean;
  /**
   * Is this member deceased?
   */
  isDeceased?: boolean;
  /**
   * Show detailed tooltip on hover
   */
  showTooltip?: boolean;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const LegalStatusBadge: React.FC<LegalStatusBadgeProps> = ({ 
  status, 
  age,
  isPolygamous = false,
  isDeceased = false,
  showTooltip = true,
  className 
}) => {
  
  // ==========================================================================
  // STATUS DETERMINATION LOGIC
  // ==========================================================================
  
  const getStatusConfig = () => {
    // If deceased, they're not eligible for inheritance (they're the deceased)
    if (isDeceased) {
      return {
        variant: 'secondary' as const,
        className: 'bg-gray-100 text-gray-700 border-gray-300',
        icon: <UserX className="w-3 h-3" />,
        text: 'Deceased (Testator)',
        description: 'The person whose estate is being administered',
        severity: 'neutral' as const,
      };
    }

    // MINOR STATUS (Highest priority for succession concerns)
    if (status.isMinor) {
      if (!status.hasGuardian) {
        return {
          variant: 'destructive' as const,
          className: 'bg-red-50 text-red-700 border-red-200',
          icon: <AlertTriangle className="w-3 h-3" />,
          text: 'Minor (No Guardian)',
          description: 'Child under 18 without legal guardian. Critical for succession.',
          severity: 'critical' as const,
        };
      }
      return {
        variant: 'warning' as const,
        className: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: <Baby className="w-3 h-3" />,
        text: 'Minor (Guarded)',
        description: 'Child under 18 with appointed guardian',
        severity: 'warning' as const,
      };
    }

    // S.29 DEPENDENT (Section 29 of Law of Succession Act)
    if (status.qualifiesForS29) {
      const isAdultDependent = !status.isMinor && status.qualifiesForS29;
      return {
        variant: 'default' as const,
        className: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: <Shield className="w-3 h-3" />,
        text: isAdultDependent ? 'S.29 Dependent' : 'S.29 Child Dependent',
        description: isAdultDependent 
          ? 'Adult dependent eligible for maintenance from estate'
          : 'Child dependent under Section 29',
        severity: 'high' as const,
      };
    }

    // INHERITANCE ELIGIBILITY
    switch (status.inheritanceEligibility) {
      case 'FULL':
        return {
          variant: 'success' as const,
          className: 'bg-green-50 text-green-700 border-green-200',
          icon: isPolygamous ? <Users className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />,
          text: isPolygamous ? 'Polygamous Beneficiary' : 'Full Beneficiary',
          description: isPolygamous 
            ? 'Full beneficiary under polygamous distribution (S.40)'
            : 'Full beneficiary under normal distribution',
          severity: 'success' as const,
        };
        
      case 'LIMITED':
        return {
          variant: 'warning' as const,
          className: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <Scale className="w-3 h-3" />,
          text: 'Limited Beneficiary',
          description: 'Limited inheritance rights (e.g., step-child, cohabitant)',
          severity: 'medium' as const,
        };
        
      case 'NONE':
        return {
          variant: 'destructive' as const,
          className: 'bg-red-50 text-red-700 border-red-200',
          icon: <XCircle className="w-3 h-3" />,
          text: 'Not Eligible',
          description: 'No inheritance rights under Kenyan succession law',
          severity: 'critical' as const,
        };
        
      case 'PENDING_VERIFICATION':
        return {
          variant: 'outline' as const,
          className: 'bg-slate-50 text-slate-700 border-slate-300',
          icon: <Clock className="w-3 h-3" />,
          text: 'Pending Verification',
          description: 'Inheritance eligibility pending document verification',
          severity: 'neutral' as const,
        };
        
      default:
        return {
          variant: 'secondary' as const,
          className: 'bg-slate-50 text-slate-700 border-slate-300',
          icon: <UserCheck className="w-3 h-3" />,
          text: 'Beneficiary',
          description: 'General beneficiary status',
          severity: 'neutral' as const,
        };
    }
  };

  const config = getStatusConfig();
  
  // ==========================================================================
  // TOOLTIP CONTENT
  // ==========================================================================
  
  const renderTooltipContent = () => {
    const additionalInfo: string[] = [];
    
    if (age !== undefined) {
      additionalInfo.push(`Age: ${age} years`);
    }
    
    if (status.isMinor) {
      additionalInfo.push('Minor: Requires legal guardian for succession');
      if (status.hasGuardian) {
        additionalInfo.push('✓ Guardian appointed');
      } else {
        additionalInfo.push('✗ No guardian - Critical issue');
      }
    }
    
    if (status.qualifiesForS29) {
      additionalInfo.push('✓ Qualifies as dependent under S.29');
      additionalInfo.push('Eligible for maintenance from estate');
    }
    
    if (isPolygamous) {
      additionalInfo.push('Member of polygamous family (S.40)');
    }
    
    switch (status.inheritanceEligibility) {
      case 'FULL':
        additionalInfo.push('Full inheritance rights');
        break;
      case 'LIMITED':
        additionalInfo.push('Limited inheritance rights');
        break;
      case 'NONE':
        additionalInfo.push('No inheritance rights under law');
        break;
      case 'PENDING_VERIFICATION':
        additionalInfo.push('Pending document verification');
        break;
    }
    
    // Add Kenyan law context
    if (status.isMinor && !status.hasGuardian) {
      additionalInfo.push('⚠️ Kenyan law requires guardian for minors in succession');
    }
    
    if (status.qualifiesForS29 && !status.isMinor) {
      additionalInfo.push('🔒 S.29: Dependents can claim maintenance');
    }
    
    return (
      <div className="max-w-xs space-y-2">
        <div className="font-medium">{config.text}</div>
        <p className="text-sm text-muted-foreground">{config.description}</p>
        
        {additionalInfo.length > 0 && (
          <div className="space-y-1">
            {additionalInfo.map((info, idx) => (
              <div key={idx} className="text-xs flex items-start gap-1">
                <span className="mt-0.5">•</span>
                <span>{info}</span>
              </div>
            ))}
          </div>
        )}
        
        <div className="pt-2 border-t text-xs text-muted-foreground">
          Based on Kenyan Law of Succession Act
        </div>
      </div>
    );
  };

  // ==========================================================================
  // BADGE RENDER
  // ==========================================================================
  
  const badgeElement = (
    <Badge 
      variant={config.variant}
      className={cn(
        "gap-1 px-2 py-0.5 text-xs font-medium transition-all hover:scale-105",
        config.className,
        className
      )}
    >
      {config.icon}
      <span className="whitespace-nowrap">{config.text}</span>
    </Badge>
  );

  // ==========================================================================
  // MAIN RENDER
  // ==========================================================================
  
  if (showTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeElement}
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="z-50">
          {renderTooltipContent()}
        </TooltipContent>
      </Tooltip>
    );
  }

  return badgeElement;
};

// ============================================================================
// COMPACT VERSION FOR DENSE DISPLAYS
// ============================================================================

interface CompactLegalStatusBadgeProps extends Omit<LegalStatusBadgeProps, 'showTooltip'> {
  showText?: boolean;
}

export const CompactLegalStatusBadge: React.FC<CompactLegalStatusBadgeProps> = ({
  status,
  isDeceased,
  showText = false,
  className
}) => {
  const getCompactConfig = () => {
    if (isDeceased) {
      return { icon: <UserX className="w-3 h-3" />, color: 'text-gray-500', tooltip: 'Deceased' };
    }
    
    if (status.isMinor) {
      if (!status.hasGuardian) {
        return { icon: <AlertTriangle className="w-3 h-3" />, color: 'text-red-500', tooltip: 'Minor (No Guardian)' };
      }
      return { icon: <Baby className="w-3 h-3" />, color: 'text-amber-500', tooltip: 'Minor' };
    }
    
    if (status.qualifiesForS29) {
      return { icon: <Shield className="w-3 h-3" />, color: 'text-blue-500', tooltip: 'S.29 Dependent' };
    }
    
    switch (status.inheritanceEligibility) {
      case 'FULL':
        return { icon: <CheckCircle2 className="w-3 h-3" />, color: 'text-green-500', tooltip: 'Full Beneficiary' };
      case 'LIMITED':
        return { icon: <Scale className="w-3 h-3" />, color: 'text-amber-500', tooltip: 'Limited Beneficiary' };
      case 'NONE':
        return { icon: <XCircle className="w-3 h-3" />, color: 'text-red-500', tooltip: 'Not Eligible' };
      case 'PENDING_VERIFICATION':
        return { icon: <Clock className="w-3 h-3" />, color: 'text-slate-500', tooltip: 'Pending Verification' };
      default:
        return { icon: <UserCheck className="w-3 h-3" />, color: 'text-slate-500', tooltip: 'Beneficiary' };
    }
  };

  const config = getCompactConfig();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 rounded text-xs",
          "bg-white/80 backdrop-blur-sm border",
          className
        )}>
          <div className={cn("flex-shrink-0", config.color)}>
            {config.icon}
          </div>
          {showText && (
            <span className="truncate max-w-[80px] font-medium">
              {config.tooltip}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="z-50">
        {config.tooltip}
      </TooltipContent>
    </Tooltip>
  );
};

// ============================================================================
// STATUS SUMMARY COMPONENT (For Family Dashboard)
// ============================================================================

interface LegalStatusSummaryProps {
  statuses: Array<{
    status: LegalStatus;
    count: number;
    label: string;
  }>;
  className?: string;
}

export const LegalStatusSummary: React.FC<LegalStatusSummaryProps> = ({ statuses, className }) => {
  const getSeverity = (eligibility: string, qualifiesForS29: boolean, isMinor: boolean) => {
    if (isMinor) return 'critical';
    if (qualifiesForS29) return 'high';
    if (eligibility === 'NONE') return 'medium';
    if (eligibility === 'LIMITED') return 'low';
    if (eligibility === 'PENDING_VERIFICATION') return 'neutral';
    return 'success';
  };

  const severityOrder = ['critical', 'high', 'medium', 'low', 'neutral', 'success'];

  const sortedStatuses = [...statuses].sort((a, b) => {
    const aSev = getSeverity(a.status.inheritanceEligibility, a.status.qualifiesForS29, a.status.isMinor);
    const bSev = getSeverity(b.status.inheritanceEligibility, b.status.qualifiesForS29, b.status.isMinor);
    return severityOrder.indexOf(aSev) - severityOrder.indexOf(bSev);
  });

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <BookOpen className="h-4 w-4 text-primary" />
        <span>Inheritance Eligibility Summary</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sortedStatuses.map((item, idx) => (
          <div 
            key={idx} 
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border",
              "transition-colors hover:bg-muted/50"
            )}
          >
            <div className="flex items-center gap-2">
              <LegalStatusBadge 
                status={item.status} 
                showTooltip={false}
                className="scale-90"
              />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <div className="text-lg font-semibold">
              {item.count}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-xs text-muted-foreground flex items-center gap-2">
        <AlertCircle className="h-3 w-3" />
        <span>Based on Kenyan Law of Succession Act (Cap. 160) Section 29 & 40</span>
      </div>
    </div>
  );
};