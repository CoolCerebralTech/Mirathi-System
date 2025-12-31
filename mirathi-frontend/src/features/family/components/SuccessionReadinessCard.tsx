// FILE: src/features/family/components/SuccessionReadinessCard.tsx

import React from 'react';
import { 
  CheckCircle, 
  AlertOctagon, 
  ArrowRight, 
  Shield,
  Users,
  FileCheck,
  AlertTriangle,
  BookOpen,
  Scale,
  Clock,
  Target,
  TrendingUp,
  XCircle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardContent, 
  CardFooter,
  Progress, 
  Button,
  Badge,
  Separator,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui';
import { useSuccessionReadiness } from '../family.api';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/common';

// ============================================================================
// COMPONENTS
// ============================================================================

interface ReadinessSectionProps {
  title: string;
  score: number;
  status: 'PASS' | 'WARNING' | 'FAIL' | 'NOT_APPLICABLE';
  issues: string[];
  icon: React.ReactNode;
  description?: string;
  isExpanded?: boolean;
}

const ReadinessSection: React.FC<ReadinessSectionProps> = ({
  title,
  score,
  status,
  issues,
  icon,
  description,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'PASS':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          iconColor: 'text-green-600',
          progressColor: 'bg-green-600',
          icon: <CheckCircle2 className="h-4 w-4" />,
        };
      case 'WARNING':
        return {
          color: 'bg-amber-100 text-amber-800 border-amber-200',
          iconColor: 'text-amber-600',
          progressColor: 'bg-amber-600',
          icon: <AlertTriangle className="h-4 w-4" />,
        };
      case 'FAIL':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          iconColor: 'text-red-600',
          progressColor: 'bg-red-600',
          icon: <XCircle className="h-4 w-4" />,
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          iconColor: 'text-gray-600',
          progressColor: 'bg-gray-600',
          icon: <Clock className="h-4 w-4" />,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <AccordionItem value={title} className="border rounded-lg">
      <AccordionTrigger className="px-4 py-3 hover:no-underline">
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", config.color)}>
              {icon}
            </div>
            <div className="text-left">
              <div className="font-medium">{title}</div>
              {description && (
                <div className="text-xs text-muted-foreground">{description}</div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className={cn("gap-1", config.color)}>
              {config.icon}
              {status.replace('_', ' ')}
            </Badge>
            
            <div className="flex items-center gap-2">
              <div className="w-24">
                <Progress value={score} className={cn("h-2", config.progressColor)} />
              </div>
              <span className="text-sm font-medium w-10 text-right">{score}%</span>
            </div>
          </div>
        </div>
      </AccordionTrigger>
      
      <AccordionContent className="px-4 pb-4">
        {issues.length > 0 ? (
          <div className="space-y-2">
            <div className="text-sm font-medium">Issues to Address:</div>
            <ul className="space-y-2">
              {issues.map((issue, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">All requirements met for this section</span>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface SuccessionReadinessCardProps {
  familyId: string;
  className?: string;
}

export const SuccessionReadinessCard: React.FC<SuccessionReadinessCardProps> = ({ 
  familyId, 
  className 
}) => {
  const { data, isLoading, error, refetch } = useSuccessionReadiness(familyId);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Succession Readiness</CardTitle>
          <CardDescription>Analyzing family structure for court filing...</CardDescription>
        </CardHeader>
        <CardContent>
          <LoadingSpinner text="Assessing Kenyan law compliance..." />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={cn("border-destructive/50", className)}>
        <CardHeader>
          <CardTitle className="text-destructive">Assessment Failed</CardTitle>
          <CardDescription>Unable to analyze succession readiness</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => refetch()}>
            Retry Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  const {
    overallScore,
    readinessLevel,
    dependencyAnalysis,
    polygamyAnalysis,
    dataIntegrity,
    recommendations,
    generatedAt
  } = data;

  // Determine card styling based on readiness
  const getReadinessConfig = () => {
    switch (readinessLevel) {
      case 'READY_TO_FILE':
        return {
          border: 'border-green-200',
          bg: 'bg-green-50',
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          text: 'Ready for Court Filing',
          description: 'All legal requirements met for succession proceedings',
        };
      case 'PARTIAL':
        return {
          border: 'border-amber-200',
          bg: 'bg-amber-50',
          icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
          text: 'Partially Ready',
          description: 'Some requirements missing for court filing',
        };
      case 'NOT_READY':
        return {
          border: 'border-red-200',
          bg: 'bg-red-50',
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          text: 'Not Ready',
          description: 'Critical issues must be resolved before filing',
        };
      default:
        return {
          border: 'border-gray-200',
          bg: 'bg-gray-50',
          icon: <Clock className="h-5 w-5 text-gray-600" />,
          text: 'Analysis Required',
          description: 'Family structure needs assessment',
        };
    }
  };

  const readinessConfig = getReadinessConfig();
  const highPriorityIssues = recommendations.filter(r => r.priority === 'HIGH');
  const mediumPriorityIssues = recommendations.filter(r => r.priority === 'MEDIUM');
  const lowPriorityIssues = recommendations.filter(r => r.priority === 'LOW');

  // Calculate scores for each section
  const dependencyScore = dependencyAnalysis.status === 'PASS' ? 100 : 
                         dependencyAnalysis.status === 'WARNING' ? 60 : 0;
  
  const polygamyScore = polygamyAnalysis.isPolygamous
  ? (polygamyAnalysis.status === 'FAIL' ? 0 : 100) // FAIL = 0, NOT_APPLICABLE = 100
  : 100; // Not polygamous gets full score

  const dataIntegrityScore = dataIntegrity.verifiedMembersPercentage;

  return (
    <Card className={cn("overflow-hidden", readinessConfig.border, className)}>
      {/* Header */}
      <CardHeader className={cn("pb-3", readinessConfig.bg)}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              {readinessConfig.icon}
              <CardTitle>Succession Readiness Assessment</CardTitle>
            </div>
            <CardDescription>
              {readinessConfig.text} • Based on Kenyan Law of Succession Act
            </CardDescription>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold">{overallScore}%</div>
            <div className="text-xs text-muted-foreground">Overall Score</div>
          </div>
        </div>
        
        {/* Main Progress Bar */}
        <div className="pt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span>Progress to Court Filing</span>
            <span className="font-medium">
              {readinessLevel === 'READY_TO_FILE' ? 'Ready' : 'Incomplete'}
            </span>
          </div>
          <Progress 
            value={overallScore} 
            className={cn(
              "h-3",
              readinessLevel === 'READY_TO_FILE' ? "bg-green-200" :
              readinessLevel === 'PARTIAL' ? "bg-amber-200" :
              "bg-red-200"
            )}
          />
        </div>
      </CardHeader>

      {/* Assessment Sections */}
      <CardContent className="pt-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Legal Compliance Analysis</h3>
          </div>
          
          <Accordion type="multiple" defaultValue={['Dependency Analysis']} className="space-y-3">
            {/* S.29 Dependency Analysis */}
            <ReadinessSection
              title="S.29 Dependency Analysis"
              score={dependencyScore}
              status={dependencyAnalysis.status}
              issues={dependencyAnalysis.issues}
              icon={<Shield className="h-5 w-5" />}
              description="Analysis of dependents eligible for maintenance"
            />
            
            {/* S.40 Polygamy Analysis */}
            <ReadinessSection
              title="S.40 Polygamy Analysis"
              score={polygamyScore}
              status={polygamyAnalysis.status}
              issues={polygamyAnalysis.issues}
              icon={<Users className="h-5 w-5" />}
              description="Polygamous family distribution compliance"
            />
            
            {/* Data Integrity */}
            <ReadinessSection
              title="Data Integrity"
              score={dataIntegrityScore}
              status={dataIntegrityScore >= 80 ? 'PASS' : dataIntegrityScore >= 50 ? 'WARNING' : 'FAIL'}
              issues={dataIntegrity.missingCriticalDocuments.map(doc => `Missing: ${doc}`)}
              icon={<FileCheck className="h-5 w-5" />}
              description="Member verification and document completeness"
            />
          </Accordion>
        </div>

        {/* Recommendations */}
        <Separator className="my-6" />
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Action Items</h3>
            </div>
            <Badge variant="outline" className="gap-1">
              {recommendations.length} total
            </Badge>
          </div>

          {/* High Priority Issues */}
          {highPriorityIssues.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-red-700">
                <AlertOctagon className="h-4 w-4" />
                High Priority ({highPriorityIssues.length})
              </div>
              {highPriorityIssues.map((rec, idx) => (
                <div key={idx} className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">{rec.title}</div>
                      <p className="text-sm text-red-700">{rec.description}</p>
                    </div>
                    {rec.actionLink && (
                      <Button variant="ghost" size="sm" className="h-8">
                        Fix <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Medium Priority Issues */}
          {mediumPriorityIssues.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                Medium Priority ({mediumPriorityIssues.length})
              </div>
              {mediumPriorityIssues.map((rec, idx) => (
                <div key={idx} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">{rec.title}</div>
                      <p className="text-sm text-amber-700">{rec.description}</p>
                    </div>
                    {rec.actionLink && (
                      <Button variant="ghost" size="sm" className="h-8">
                        Review <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Low Priority Issues */}
          {lowPriorityIssues.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                <CheckCircle className="h-4 w-4" />
                Low Priority ({lowPriorityIssues.length})
              </div>
              {lowPriorityIssues.map((rec, idx) => (
                <div key={idx} className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">{rec.title}</div>
                      <p className="text-sm text-green-700">{rec.description}</p>
                    </div>
                    {rec.actionLink && (
                      <Button variant="ghost" size="sm" className="h-8">
                        Optimize <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {recommendations.length === 0 && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <div className="font-medium text-green-800">All requirements met</div>
                  <p className="text-sm text-green-700">No action items needed</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dependency Claimants */}
        {dependencyAnalysis.potentialClaimantsCount > 0 && (
          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <div className="font-medium text-blue-800">S.29 Dependents Identified</div>
            </div>
            <div className="text-sm text-blue-700">
              <p className="mb-2">
                <strong>{dependencyAnalysis.potentialClaimantsCount}</strong> potential dependents 
                eligible for maintenance under Section 29
              </p>
              {dependencyAnalysis.claimantNames.length > 0 && (
                <div>
                  <p className="font-medium mb-1">Potential claimants:</p>
                  <div className="flex flex-wrap gap-1">
                    {dependencyAnalysis.claimantNames.map((name, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs bg-white">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* Footer */}
      <CardFooter className="border-t bg-muted/20">
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Scale className="h-3 w-3" />
            <span>Kenyan Law of Succession Act (Cap. 160)</span>
          </div>
          <div className="text-right">
            <div>Last analyzed: {new Date(generatedAt).toLocaleDateString()}</div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>Score updated in real-time</span>
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

// ============================================================================
// SIMPLIFIED VERSION FOR DASHBOARDS
// ============================================================================

interface CompactSuccessionReadinessProps {
  familyId: string;
  showDetails?: boolean;
  className?: string;
}

export const CompactSuccessionReadiness: React.FC<CompactSuccessionReadinessProps> = ({
  familyId,
  showDetails = false,
  className
}) => {
  const { data, isLoading } = useSuccessionReadiness(familyId);

  if (isLoading || !data) {
    return (
      <div className={cn("rounded-lg border p-4", className)}>
        <div className="animate-pulse flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-8"></div>
        </div>
      </div>
    );
  }

  const getStatusColor = () => {
    switch (data.readinessLevel) {
      case 'READY_TO_FILE': return 'bg-green-100 text-green-800 border-green-300';
      case 'PARTIAL': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'NOT_READY': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className={cn("rounded-lg border p-4", getStatusColor(), className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <span className="font-medium">Succession Readiness</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-lg font-bold">{data.overallScore}%</div>
          <Badge variant="outline" className="text-xs">
            {data.readinessLevel.replace('_', ' ')}
          </Badge>
        </div>
      </div>
      
      {showDetails && (
        <div className="mt-3 space-y-2">
          <Progress value={data.overallScore} className="h-2" />
          <div className="text-xs">
            {data.recommendations.filter(r => r.priority === 'HIGH').length} high priority issues
          </div>
        </div>
      )}
    </div>
  );
};