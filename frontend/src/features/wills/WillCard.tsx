// src/features/wills/WillCard.tsx
// ============================================================================
// Will Card Component
// ============================================================================
// - Displays a summary of a single will.
// - Shows the will's title, status, and a count of assets/beneficiaries.
// - Provides a link to the detailed will management page.
// ============================================================================

import { Link } from 'react-router-dom';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import type { Will } from '../../types';
import { WillStatusBadge } from './WillStatusBadge';

interface WillCardProps {
    will: Will;
}

export const WillCard = ({ will }: WillCardProps) => {
    const assetCount = new Set(will.beneficiaryAssignments.map(a => a.assetId)).size;
    const beneficiaryCount = new Set(will.beneficiaryAssignments.map(a => a.beneficiaryId)).size;

    return (
        <li className="col-span-1 flex flex-col divide-y divide-gray-200 rounded-lg bg-white text-center shadow">
            <div className="flex flex-1 flex-col p-8">
                <DocumentTextIcon className="mx-auto h-12 w-12 flex-shrink-0 text-gray-400" />
                <h3 className="mt-6 text-sm font-medium text-gray-900">{will.title}</h3>
                <dl className="mt-1 flex flex-grow flex-col justify-between">
                    <dt className="sr-only">Status</dt>
                    <dd className="mt-3">
                        <WillStatusBadge status={will.status} />
                    </dd>
                </dl>
            </div>
            <div>
                <div className="-mt-px flex divide-x divide-gray-200">
                    <div className="flex w-0 flex-1">
                        <div className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-700">
                            {assetCount} Assets / {beneficiaryCount} Beneficiaries
                        </div>
                    </div>
                    <div className="-ml-px flex w-0 flex-1">
                        <Link to={`/wills/${will.id}`} className="relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-br-lg border border-transparent py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                            Manage Will
                        </Link>
                    </div>
                </div>
            </div>
        </li>
    );
};