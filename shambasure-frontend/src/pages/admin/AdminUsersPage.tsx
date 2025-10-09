// FILE: src/pages/admin/AdminUsersPage.tsx

import { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { UserTable } from '../../features/admin/components/UserTable';
import { useAdminUsers } from '../../features/admin/admin.api';
import { type UserQuery } from '../../types';
import { useDebounce } from '../../hooks/useDebounce'; // We will create this small utility hook
import { SearchBar } from '../../components/common/SearchBar';
import { DataTable } from '../../components/ui/DataTable'; // Import the generic DataTable
import { userColumns } from '../../features/admin/components/UserTable'; // Import the column definitions

export function AdminUsersPage() {
  // State for managing pagination and filters
  const [filters, setFilters] = useState<UserQuery>({
    page: 1,
    limit: 10,
    // Add other filter states here if needed, e.g., role: undefined
  });

  // Fetch data using our hook and the current filters
  const { data: userData, isLoading, isError } = useAdminUsers(filters);
  
  // This would be for a search input if we add one
  // const [searchTerm, setSearchTerm] = useState('');
  // const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Update filters when search term changes
  // useEffect(() => {
  //   setFilters(prev => ({ ...prev, search: debouncedSearchTerm, page: 1 }));
  // }, [debouncedSearchTerm]);


  // Calculate pagination details
  const users = userData?.data || [];
  const totalUsers = userData?.total || 0;
  const pageCount = userData ? Math.ceil(userData.total / userData.limit) : 0;

  // Render logic
  if (isError) {
      return <div>Error loading users. Please try again.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description={`A list of all users in the system. Total: ${totalUsers}`}
        // We can add an "Invite User" button here later
        // actions={<Button>Invite User</Button>}
      />

      {/* We can add filter controls here, e.g., a search bar or a role selector */}
      {/* <div className="max-w-sm">
        <SearchBar 
          placeholder="Search by name or email..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div> */}
      
      {/* 
        We pass the loading state, columns, data, and pagination details 
        down to our generic DataTable component.
      */}
      <DataTable
        columns={userColumns}
        data={users}
        isLoading={isLoading} // We will add an isLoading prop to DataTable
        pageCount={pageCount}
        pagination={{
            pageIndex: filters.page ? filters.page - 1 : 0,
            pageSize: filters.limit || 10,
        }}
        onPaginationChange={(updater) => {
            if (typeof updater === 'function') {
                const newPagination = updater({ pageIndex: filters.page ? filters.page - 1 : 0, pageSize: filters.limit || 10 });
                setFilters(prev => ({
                    ...prev,
                    page: newPagination.pageIndex + 1,
                    limit: newPagination.pageSize,
                }));
            }
        }}
      />
    </div>
  );
}