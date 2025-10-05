// src/components/common/NotificationDropdown.tsx
// ============================================================================
// Notification Dropdown Component
// ============================================================================
// - Displays a list of recent notifications to the user.
// - Built with Headless UI's `Menu` for accessibility.
// - Currently uses mock data, but is architected to easily accept real data
//   from a future `useNotifications` hook.
// ============================================================================

import { Menu, Transition } from '@headlessui/react';
import { BellIcon } from '@heroicons/react/24/outline';
import { Fragment } from 'react';

// MOCK DATA - This will be replaced by data from an API call
const mockNotifications = [
    { id: 1, text: 'Your document "Title Deed ABC" has been verified.', time: '2h ago' },
    { id: 2, text: 'A new heir, Jane Doe, was added to your "Family Will".', time: '1d ago' },
    { id: 3, text: 'Reminder: Please review your will by Dec 31st.', time: '3d ago' },
];

export const NotificationDropdown = () => {
    return (
        <Menu as="div" className="relative inline-block text-left">
            <div>
                <Menu.Button className="relative flex rounded-full bg-gray-100 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                    <span className="sr-only">View notifications</span>
                    <BellIcon className="h-6 w-6" aria-hidden="true" />
                    {/* Notification count badge */}
                    {mockNotifications.length > 0 && (
                         <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                            {mockNotifications.length}
                         </span>
                    )}
                </Menu.Button>
            </div>
            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="p-2">
                        <div className="border-b border-gray-200 pb-2 mb-2">
                            <h3 className="text-sm font-medium text-gray-900 px-2">Notifications</h3>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                            {mockNotifications.length > 0 ? (
                                mockNotifications.map((notification) => (
                                    <Menu.Item key={notification.id}>
                                        {({ active }) => (
                                            <a href="#" className={`${active ? 'bg-gray-100' : ''} block rounded-md px-2 py-2 text-sm text-gray-700`}>
                                                <p className="font-medium">{notification.text}</p>
                                                <p className="text-xs text-gray-500">{notification.time}</p>
                                            </a>
                                        )}
                                    </Menu.Item>
                                ))
                            ) : (
                                <div className="px-2 py-4 text-center text-sm text-gray-500">
                                    No new notifications
                                </div>
                            )}
                        </div>
                         <div className="border-t border-gray-200 pt-2 mt-2">
                            <Menu.Item>
                                <a href="#" className="block text-center text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                    View all notifications
                                </a>
                            </Menu.Item>
                        </div>
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
}