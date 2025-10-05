// src/features/documents/DocumentListItem.tsx
// ============================================================================
// Document List Item Component
// ============================================================================
// - Renders a single row in the document list.
// - Displays key document details like filename, size, and status.
// - Provides action buttons (Download, Delete) that trigger callbacks.
// - Uses Headless UI's `Menu` for a clean action dropdown.
// ============================================================================

import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { EllipsisVerticalIcon, ArrowDownTrayIcon, TrashIcon } from '@heroicons/react/20/solid';
import type { Document } from '../../types';
import { StatusBadge } from './StatusBadge';

// A helper function to format file sizes
const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

interface DocumentListItemProps {
    document: Document;
    onDelete: (id: string) => void;
    onDownload: (id: string, filename: string) => void;
}

export const DocumentListItem = ({ document, onDelete, onDownload }: DocumentListItemProps) => {
    return (
        <li>
            <div className="flex items-center justify-between gap-x-6 py-5 px-4 hover:bg-gray-50 rounded-lg">
                <div className="min-w-0">
                    <div className="flex items-start gap-x-3">
                        <p className="text-sm font-semibold leading-6 text-gray-900">{document.filename}</p>
                        <StatusBadge status={document.status} />
                    </div>
                    <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                        <p>
                            Uploaded on{' '}
                            <time dateTime={document.createdAt}>
                                {new Date(document.createdAt).toLocaleDateString()}
                            </time>
                        </p>
                        <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current"><circle cx={1} cy={1} r={1} /></svg>
                        <p>{formatBytes(document.sizeBytes)}</p>
                    </div>
                </div>
                <div className="flex flex-none items-center gap-x-4">
                    <button 
                        onClick={() => onDownload(document.id, document.filename)}
                        className="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block"
                    >
                        Download
                    </button>
                    {/* Action Menu for smaller screens */}
                    <Menu as="div" className="relative flex-none">
                        <Menu.Button className="-m-2.5 block p-2.5 text-gray-500 hover:text-gray-900">
                            <span className="sr-only">Open options</span>
                            <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
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
                            <Menu.Items className="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                                <Menu.Item as="div" className="sm:hidden">
                                     {({ active }) => (
                                        <button onClick={() => onDownload(document.id, document.filename)} className={`${active ? 'bg-gray-50' : ''} group flex w-full items-center px-4 py-2 text-sm text-gray-700`}>
                                            <ArrowDownTrayIcon className="mr-3 h-5 w-5 text-gray-400" />
                                            Download
                                        </button>
                                    )}
                                </Menu.Item>
                                <Menu.Item>
                                    {({ active }) => (
                                        <button onClick={() => onDelete(document.id)} className={`${active ? 'bg-gray-50' : ''} group flex w-full items-center px-4 py-2 text-sm text-red-600`}>
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
        </li>
    );
};