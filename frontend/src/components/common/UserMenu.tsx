// src/components/common/UserMenu.tsx
// ============================================================================
// User Profile Dropdown Menu
// ============================================================================
// - A dropdown component that displays the current user's name and provides
//   links to their profile and the logout action.
// - Built with Headless UI's `Menu` component for full accessibility.
// - Uses Heroicons for clean, professional icons.
// ============================================================================

import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, ArrowLeftOnRectangleIcon, UserCircleIcon } from '@heroicons/react/20/solid';
import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const UserMenu = () => {
    const { user, actions } = useAuth();

    if (!user) return null;

    return (
        <Menu as="div" className="relative inline-block text-left">
            <div>
                <Menu.Button className="inline-flex w-full justify-center items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                    {user.firstName} {user.lastName}
                    <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
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
                <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                        <Menu.Item>
                            {({ active }) => (
                                <Link to="/profile" className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} group flex items-center px-4 py-2 text-sm`}>
                                    <UserCircleIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true"/>
                                    My Profile
                                </Link>
                            )}
                        </Menu.Item>
                        <Menu.Item>
                            {({ active }) => (
                                <button onClick={actions.logout} className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} group flex w-full items-center px-4 py-2 text-sm`}>
                                    <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true"/>
                                    Sign out
                                </button>
                            )}
                        </Menu.Item>
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
}