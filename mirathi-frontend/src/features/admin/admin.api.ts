// src/api/admin.api.ts

import { 
  useMutation, 
  useQuery, 
  useQueryClient, 
  keepPreviousData
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';

// Types (Zod Schemas)
import {
  ListUsersInputSchema,
  SearchUsersInputSchema,
  ChangeRoleInputSchema,
  SuspendUserInputSchema,
  BulkSuspendUsersInputSchema,
  BulkDeleteUsersInputSchema,
  PaginatedUsersOutputSchema,
  SearchUsersResultOutputSchema,
  UserStatisticsOutputSchema,
  BulkOperationResultSchema,
  type ListUsersInput,
  type SearchUsersInput,
  type ChangeRoleInput,
  type SuspendUserInput,
  type BulkSuspendUsersInput,
  type BulkDeleteUsersInput,
  type PaginatedUsersOutput,
  type SearchUsersResultOutput,
  type UserStatisticsOutput,
  type BulkOperationResult,
} from '@/types/admin.types';

import { UserOutputSchema, type UserOutput } from '@/types/user.types';

// ============================================================================
// GRAPHQL DOCUMENTS
// ============================================================================

const ADMIN_USER_FRAGMENT = `
  fragment AdminUserFields on User {
    id
    role
    status
    displayName
    isActive
    isSuspended
    isDeleted
    createdAt
    updatedAt
    identities {
      provider
      email
    }
    profile {
      firstName
      lastName
      fullName
      phoneNumber
      county
    }
  }
`;

// --- QUERIES ---

const LIST_USERS_QUERY = `
  ${ADMIN_USER_FRAGMENT}
  query ListUsers($input: ListUsersInput!) {
    listUsers(input: $input) {
      users {
        ...AdminUserFields
      }
      total
      page
      totalPages
    }
  }
`;

const SEARCH_USERS_QUERY = `
  ${ADMIN_USER_FRAGMENT}
  query SearchUsers($input: SearchUsersInput!) {
    searchUsers(input: $input) {
      users {
        ...AdminUserFields
      }
      total
    }
  }
`;

const USER_STATISTICS_QUERY = `
  query UserStatistics {
    userStatistics {
      byStatus {
        status
        count
      }
      byRole {
        role
        count
      }
      totalUsers
    }
  }
`;

// --- MUTATIONS: LIFECYCLE ---

const ACTIVATE_USER_MUTATION = `
  ${ADMIN_USER_FRAGMENT}
  mutation ActivateUser($userId: ID!) {
    activateUser(userId: $userId) {
      ...AdminUserFields
    }
  }
`;

const SUSPEND_USER_MUTATION = `
  ${ADMIN_USER_FRAGMENT}
  mutation SuspendUser($input: SuspendUserInput!) {
    suspendUser(input: $input) {
      ...AdminUserFields
    }
  }
`;

const UNSUSPEND_USER_MUTATION = `
  ${ADMIN_USER_FRAGMENT}
  mutation UnsuspendUser($userId: ID!) {
    unsuspendUser(userId: $userId) {
      ...AdminUserFields
    }
  }
`;

const DELETE_USER_MUTATION = `
  ${ADMIN_USER_FRAGMENT}
  mutation DeleteUser($userId: ID!) {
    deleteUser(userId: $userId) {
      ...AdminUserFields
    }
  }
`;

const RESTORE_USER_MUTATION = `
  ${ADMIN_USER_FRAGMENT}
  mutation RestoreUser($userId: ID!) {
    restoreUser(userId: $userId) {
      ...AdminUserFields
    }
  }
`;

// --- MUTATIONS: ROLES ---

const CHANGE_ROLE_MUTATION = `
  ${ADMIN_USER_FRAGMENT}
  mutation ChangeUserRole($input: ChangeRoleInput!) {
    changeUserRole(input: $input) {
      ...AdminUserFields
    }
  }
`;

// --- MUTATIONS: BULK ---

const BULK_SUSPEND_MUTATION = `
  mutation BulkSuspendUsers($input: BulkSuspendUsersInput!) {
    bulkSuspendUsers(input: $input) {
      succeeded
      failed
      totalSucceeded
      totalFailed
    }
  }
`;

const BULK_DELETE_MUTATION = `
  mutation BulkDeleteUsers($input: BulkDeleteUsersInput!) {
    bulkDeleteUsers(input: $input) {
      succeeded
      failed
      totalSucceeded
      totalFailed
    }
  }
`;

// ============================================================================
// QUERY KEYS
// ============================================================================

export const adminKeys = {
  all: ['admin'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  list: (filters: ListUsersInput) => [...adminKeys.users(), 'list', filters] as const,
  search: (filters: SearchUsersInput) => [...adminKeys.users(), 'search', filters] as const,
  statistics: () => [...adminKeys.all, 'statistics'] as const,
};

// ============================================================================
// API HELPER
// ============================================================================

const request = async <T>(query: string, variables?: Record<string, unknown>): Promise<T> => {
  const { data } = await apiClient.post('/graphql', { query, variables });
  if (data.errors && data.errors.length > 0) {
    throw new Error(data.errors[0].message);
  }
  return data.data;
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

const listUsers = async (input: ListUsersInput): Promise<PaginatedUsersOutput> => {
  const validated = ListUsersInputSchema.parse(input);
  const data = await request<{ listUsers: unknown }>(LIST_USERS_QUERY, { input: validated });
  return PaginatedUsersOutputSchema.parse(data.listUsers);
};

const searchUsers = async (input: SearchUsersInput): Promise<SearchUsersResultOutput> => {
  const validated = SearchUsersInputSchema.parse(input);
  const data = await request<{ searchUsers: unknown }>(SEARCH_USERS_QUERY, { input: validated });
  return SearchUsersResultOutputSchema.parse(data.searchUsers);
};

const getUserStatistics = async (): Promise<UserStatisticsOutput> => {
  const data = await request<{ userStatistics: unknown }>(USER_STATISTICS_QUERY);
  return UserStatisticsOutputSchema.parse(data.userStatistics);
};

const activateUser = async (userId: string): Promise<UserOutput> => {
  const data = await request<{ activateUser: unknown }>(ACTIVATE_USER_MUTATION, { userId });
  return UserOutputSchema.parse(data.activateUser);
};

const suspendUser = async (input: SuspendUserInput): Promise<UserOutput> => {
  const validated = SuspendUserInputSchema.parse(input);
  const data = await request<{ suspendUser: unknown }>(SUSPEND_USER_MUTATION, { input: validated });
  return UserOutputSchema.parse(data.suspendUser);
};

const unsuspendUser = async (userId: string): Promise<UserOutput> => {
  const data = await request<{ unsuspendUser: unknown }>(UNSUSPEND_USER_MUTATION, { userId });
  return UserOutputSchema.parse(data.unsuspendUser);
};

const deleteUser = async (userId: string): Promise<UserOutput> => {
  const data = await request<{ deleteUser: unknown }>(DELETE_USER_MUTATION, { userId });
  return UserOutputSchema.parse(data.deleteUser);
};

const restoreUser = async (userId: string): Promise<UserOutput> => {
  const data = await request<{ restoreUser: unknown }>(RESTORE_USER_MUTATION, { userId });
  return UserOutputSchema.parse(data.restoreUser);
};

const changeRole = async (input: ChangeRoleInput): Promise<UserOutput> => {
  const validated = ChangeRoleInputSchema.parse(input);
  const data = await request<{ changeUserRole: unknown }>(CHANGE_ROLE_MUTATION, { input: validated });
  return UserOutputSchema.parse(data.changeUserRole);
};

const bulkSuspend = async (input: BulkSuspendUsersInput): Promise<BulkOperationResult> => {
  const validated = BulkSuspendUsersInputSchema.parse(input);
  const data = await request<{ bulkSuspendUsers: unknown }>(BULK_SUSPEND_MUTATION, { input: validated });
  return BulkOperationResultSchema.parse(data.bulkSuspendUsers);
};

const bulkDelete = async (input: BulkDeleteUsersInput): Promise<BulkOperationResult> => {
  const validated = BulkDeleteUsersInputSchema.parse(input);
  const data = await request<{ bulkDeleteUsers: unknown }>(BULK_DELETE_MUTATION, { input: validated });
  return BulkOperationResultSchema.parse(data.bulkDeleteUsers);
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

// --- Queries ---

export const useListUsers = (input: ListUsersInput) => {
  return useQuery({
    queryKey: adminKeys.list(input),
    queryFn: () => listUsers(input),
    // FIX: Replaced 'keepPreviousData: true' with 'placeholderData: keepPreviousData'
    placeholderData: keepPreviousData,
  });
};

export const useSearchUsers = (input: SearchUsersInput, enabled = true) => {
  return useQuery({
    queryKey: adminKeys.search(input),
    queryFn: () => searchUsers(input),
    enabled,
  });
};

export const useUserStatistics = () => {
  return useQuery({
    queryKey: adminKeys.statistics(),
    queryFn: getUserStatistics,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// --- Mutations: Lifecycle ---

export const useUserLifecycle = () => {
  const queryClient = useQueryClient();

  const invalidateUsers = () => {
    queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    queryClient.invalidateQueries({ queryKey: adminKeys.statistics() });
  };

  const activate = useMutation({
    mutationFn: activateUser,
    onSuccess: () => {
      toast.success('User activated');
      invalidateUsers();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const suspend = useMutation({
    mutationFn: suspendUser,
    onSuccess: () => {
      toast.success('User suspended');
      invalidateUsers();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const unsuspend = useMutation({
    mutationFn: unsuspendUser,
    onSuccess: () => {
      toast.success('User unsuspended');
      invalidateUsers();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast.success('User deleted');
      invalidateUsers();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const restore = useMutation({
    mutationFn: restoreUser,
    onSuccess: () => {
      toast.success('User restored');
      invalidateUsers();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { activate, suspend, unsuspend, remove, restore };
};

// --- Mutations: Roles ---

export const useChangeRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: changeRole,
    onSuccess: (data) => {
      toast.success(`Role changed to ${data.role}`);
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      queryClient.invalidateQueries({ queryKey: adminKeys.statistics() });
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

// --- Mutations: Bulk ---

export const useBulkOperations = () => {
  const queryClient = useQueryClient();

  const invalidateUsers = () => {
    queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    queryClient.invalidateQueries({ queryKey: adminKeys.statistics() });
  };

  const suspend = useMutation({
    mutationFn: bulkSuspend,
    onSuccess: (data) => {
      toast.success(`Suspended ${data.totalSucceeded} users`);
      if (data.totalFailed > 0) toast.warning(`Failed to suspend ${data.totalFailed} users`);
      invalidateUsers();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: bulkDelete,
    onSuccess: (data) => {
      toast.success(`Deleted ${data.totalSucceeded} users`);
      if (data.totalFailed > 0) toast.warning(`Failed to delete ${data.totalFailed} users`);
      invalidateUsers();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { suspend, remove };
};