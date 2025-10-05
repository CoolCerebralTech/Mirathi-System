// src/features/assets/AssetCard.tsx
// ============================================================================
// Asset Card Component
// ============================================================================
// - Displays the details of a single asset in a card format.
// - Integrates the `AssetTypeIcon` for visual context.
// - Provides an action menu (Edit, Delete) for managing the asset.
// ============================================================================

import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { EllipsisVerticalIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/20/solid';
import type { Asset } from '../../types';
import { AssetTypeIcon } from './AssetTypeIcon';

interface AssetCardProps {
    asset: Asset;
    onEdit: (asset: Asset) => void;
    onDelete: (id: string) => void;
}

export const AssetCard = ({ asset, onEdit, onDelete }: AssetCardProps) => {
    return (
        <li className="col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow">
            <div className="flex w-full items-center justify-between space-x-6 p-6">
                <div className="flex-1 truncate">
                    <div className="flex items-center space-x-3">
                        <h3 className="truncate text-sm font-medium text-gray-900">{asset.name}</h3>
                    </div>
                    <p className="mt-1 truncate text-sm text-gray-500">{asset.description || 'No description'}</p>
                </div>
                <div className="flex-shrink-0 h-10 w-10 text-gray-400">
                    <AssetTypeIcon type={asset.type} className="h-10 w-10" />
                </div>
            </div>
            <div>
                <div className="-mt-px flex divide-x divide-gray-200">
                    <div className="flex w-0 flex-1">
                        <span className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-900">
                           {/* Future info can go here, e.g., value */}
                        </span>
                    </div>
                    <div className="-ml-px flex w-0 flex-1">
                       <Menu as="div" className="relative inline-block w-full text-left">
                            <Menu.Button className="relative inline-flex w-full h-full items-center justify-center gap-x-3 rounded-br-lg border border-transparent py-4 text-sm font-semibold text-gray-900 hover:bg-gray-50">
                                Options
                                <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" />
                            </Menu.Button>
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <Menu.Items className="absolute bottom-14 right-0 z-10 mt-2 w-32 origin-bottom-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button onClick={() => onEdit(asset)} className={`${active ? 'bg-gray-100' : ''} group flex w-full items-center px-4 py-2 text-sm text-gray-700`}>
                                                <PencilSquareIcon className="mr-3 h-5 w-5 text-gray-400" />
                                                Edit
                                            </button>
                                        )}
                                    </Menu.Item>
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button onClick={() => onDelete(asset.id)} className={`${active ? 'bg-gray-100' : ''} group flex w-full items-center px-4 py-2 text-sm text-red-600`}>
                                                <TrashIcon className="mr-3 h-5 w-5 text-red-400" />
                                                Delete
                                            </button>
                                        )}
                                    </Menu.Item>
                                </Menu.Items>
                            </Transition>
                        </Menu>
                    </div>
                </div>
            </div>
        </li>
    );
};