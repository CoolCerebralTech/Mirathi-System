import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Card, CardContent } from '../../../components/ui';

interface ComplianceHealthScoreProps {
  score: number;
  nextReportDue?: string;
  isBonded: boolean;
}

export const ComplianceHealthScore: React.FC<ComplianceHealthScoreProps> = ({
  score,
  nextReportDue,
  isBonded,
}) => {
  const getColor = (val: number) => {
    if (val >= 90) return '#22c55e'; // Green
    if (val >= 70) return '#eab308'; // Amber
    return '#ef4444'; // Red
  };

  return (
    <Card>
      <CardContent className="flex items-center gap-6 p-6">
        <div className="h-20 w-20">
          <CircularProgressbar
            value={score}
            text={`${score}%`}
            styles={buildStyles({
              textSize: '24px',
              pathColor: getColor(score),
              textColor: getColor(score),
              trailColor: '#f1f5f9',
            })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold">Compliance Health</h3>
          <p className="text-sm text-muted-foreground">
            {score >= 90 ? 'Excellent Standing' : 'Action Required'}
          </p>
          <div className="mt-2 flex gap-2 text-xs">
            {nextReportDue && (
                <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">
                    Next Due: {new Date(nextReportDue).toLocaleDateString()}
                </span>
            )}
            {isBonded && (
                <span className="rounded bg-blue-50 px-2 py-0.5 text-blue-700">
                    Bonded
                </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};