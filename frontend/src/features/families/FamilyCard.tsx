// src/features/families/FamilyCard.tsx
// ============================================================================
// Family Card Component
// ============================================================================
// - Displays a summary of a single family group.
// - Shows the family name and avatars of the first few members.
// - Provides a link to view the full details of the family.
// ============================================================================

import { Link } from 'react-router-dom';
import { UsersIcon } from '@heroicons/react/24/outline';
import type { Family } from '../../types';

interface FamilyCardProps {
    family: Family;
}

// Simple avatar component for displaying initials
const Avatar = ({ initials }: { initials: string }) => (
    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center">
        <span className="font-bold text-xs">{initials}</span>
    </div>
);

export const FamilyCard = ({ family }: FamilyCardProps) => {
    return (
        <li className="col-span-1 flex rounded-md shadow-sm">
            <div className="flex w-16 flex-shrink-0 items-center justify-center rounded-l-md bg-indigo-600 text-sm font-medium text-white">
                <UsersIcon className="h-8 w-8" />
            </div>
            <div className="flex flex-1 items-center justify-between truncate rounded-r-md border-b border-r border-t border-gray-200 bg-white">
                <div className="flex-1 truncate px-4 py-2 text-sm">
                    <p className="font-medium text-gray-900 hover:text-gray-600">{family.name}</p>
                    <div className="flex -space-x-2 overflow-hidden mt-2">
                        {family.members.slice(0, 4).map(member => (
                             <Avatar key={member.userId} initials={`${member.user.firstName.charAt(0)}${member.user.lastName.charAt(0)}`} />
                        ))}
                        {family.members.length > 4 && (
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center">
                                <span className="font-bold text-xs">+{family.members.length - 4}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex-shrink-0 pr-2">
                    <Link to={`/families/${family.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-transparent bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                        <span className="sr-only">Open options</span>
                        View
                    </Link>
                </div>
            </div>
        </li>
    );
};