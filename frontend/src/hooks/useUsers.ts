// src/hooks/useUsers.ts
// ============================================================================
// REFACTORED: Custom Hook for Managing Users (Admin) with TanStack Query
// ============================================================================
// - Manages the server state for the list of all users using TanStack Query.
// - `useQuery` handles all fetching, caching, loading, and error states.
// - `useMutation` provides a clean and robust way to handle the role update action.
// - On a successful mutation, it automatically invalidates the user list query,
//   triggering a re-fetch to ensure the UI is always up-to-date.
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getUsers, updateUserRole } from '../api/admin';
import type { User, UserRole } from '../types';

// A unique key for this query, used for caching and invalidation
export const usersQueryKey = ['admin', 'users'];

export const useUsers = () => {
  const queryClient = useQueryClient();

  // useQuery for fetching the list of users
  const { 
    data: users, 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: usersQueryKey,
    queryFn: () => getUsers(), // We can pass pagination params here later
    select: (data) => data.data, // Select the nested data array
    initialData: { data: [], meta: {} as any },
  });

  // useMutation for updating a user's role
  const { mutate: updateRole, isPending: isUpdatingRole } = useMutation({
    mutationFn: (variables: { userId: string; newRole: UserRole }) => 
        updateUserRole(variables.userId, { role: variables.newRole }),
    onSuccess: () => {
      toast.success('User role updated successfully!');
      // When the mutation is successful, invalidate the 'users' query.
      // This tells TanStack Query to automatically re-fetch the user list.
      queryClient.invalidateQueries({ queryKey: usersQueryKey });
    },
    onError: (error) => {
      toast.error('Failed to update user role.');
      console.error(error);
    },
  });

  return {
    users: users || [],
    isLoading,
    isError,
    updateRole,
    isUpdatingRole,
  };
};