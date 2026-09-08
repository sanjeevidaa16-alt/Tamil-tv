import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Shield,
  Briefcase,
  User as UserIcon,
  Loader2,
  AlertTriangle,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Profile, UserRole } from '../../types';
import { userService } from '../../services/userService';
import { useToast } from '../../components/common/Toast';
import { formatTimeAgo } from '../../utils/formatters';

export const UsersManage: React.FC = () => {
  const { showToast } = useToast();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, user, manager, admin, active, inactive
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Role change confirmation modal state
  const [confirmModalUser, setConfirmModalUser] = useState<Profile | null>(null);
  const [pendingNewRole, setPendingNewRole] = useState<'user' | 'manager' | null>(null);
  const [updatingRole, setUpdatingRole] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getAllUsers();
      setProfiles(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleStatus = async (user: Profile) => {
    setTogglingId(user.id);
    try {
      const newStatus = !user.is_active;
      await userService.toggleUserStatus(user.id, newStatus);
      showToast(
        `User ${user.full_name || user.email} ${newStatus ? 'activated' : 'deactivated'}`,
        'success'
      );
      await loadUsers();
    } catch (err: any) {
      showToast(err.message || 'Status update failed', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleRoleSelectChange = (user: Profile, newRole: 'user' | 'manager') => {
    if (user.role === 'admin') {
      const adminCount = profiles.filter((p) => p.role === 'admin').length;
      if (adminCount <= 1) {
        showToast('You cannot remove the final administrator account.', 'error');
        return;
      }
      showToast('Admin accounts are system-protected and cannot be modified here.', 'error');
      return;
    }
    if (user.role === newRole) return;

    setConfirmModalUser(user);
    setPendingNewRole(newRole);
  };

  const confirmRoleChange = async () => {
    if (!confirmModalUser || !pendingNewRole || updatingRole) return;

    setUpdatingRole(true);
    try {
      await userService.setUserRole(confirmModalUser.id, pendingNewRole);
      if (pendingNewRole === 'manager') {
        showToast('✓ User role updated to Manager.', 'success');
      } else {
        showToast('✓ Manager privileges removed.', 'success');
      }
      setConfirmModalUser(null);
      setPendingNewRole(null);
      await loadUsers();
    } catch (err: any) {
      console.error('Role change failed:', err);
      showToast(err.message || 'Unable to update user role.', 'error');
      // Reset modal and reload real database state to restore UI cleanly
      setConfirmModalUser(null);
      setPendingNewRole(null);
      await loadUsers();
    } finally {
      setUpdatingRole(false);
    }
  };

  const filtered = profiles.filter((p) => {
    const matchSearch =
      (p.full_name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (p.email?.toLowerCase().includes(search.toLowerCase()) ?? false);

    let matchFilter = true;
    if (filterType === 'user') matchFilter = p.role === 'user';
    else if (filterType === 'manager') matchFilter = p.role === 'manager';
    else if (filterType === 'admin') matchFilter = p.role === 'admin';
    else if (filterType === 'active') matchFilter = p.is_active === true;
    else if (filterType === 'inactive') matchFilter = p.is_active === false;

    return matchSearch && matchFilter;
  });

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedUsers = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalUsersCount = profiles.filter((p) => p.role === 'user').length;
  const totalManagersCount = profiles.filter((p) => p.role === 'manager').length;
  const totalAdminsCount = profiles.filter((p) => p.role === 'admin').length;
  const activeCount = profiles.filter((p) => p.is_active).length;

  return (
    <div id="admin-users-manage" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            <span>User Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage registered accounts, assign Manager permissions, and toggle access status.
          </p>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-[#11131d] border border-slate-800 rounded-2xl">
          <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Standard Users</p>
          <p className="text-2xl font-black text-white mt-1">{totalUsersCount}</p>
        </div>
        <div className="p-4 bg-[#11131d] border border-slate-800 rounded-2xl">
          <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">Managers</p>
          <p className="text-2xl font-black text-white mt-1">{totalManagersCount}</p>
        </div>
        <div className="p-4 bg-[#11131d] border border-slate-800 rounded-2xl">
          <p className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">Super Admins</p>
          <p className="text-2xl font-black text-white mt-1">{totalAdminsCount}</p>
        </div>
        <div className="p-4 bg-[#11131d] border border-slate-800 rounded-2xl">
          <p className="text-[11px] font-semibold text-teal-400 uppercase tracking-wider">Active Accounts</p>
          <p className="text-2xl font-black text-white mt-1">{activeCount}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-[#11131c] border border-slate-800 rounded-2xl">
        <div className="relative flex-1">
          <input
            id="user-search-input"
            type="text"
            placeholder="Search member by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2">
          <select
            id="user-filter-select"
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#181a26] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
          >
            <option value="all">All Accounts</option>
            <option value="user">Users</option>
            <option value="manager">Managers</option>
            <option value="admin">Super Admins</option>
            <option value="active">Active Status</option>
            <option value="inactive">Inactive Status</option>
          </select>

          <select
            id="user-pagesize-select"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-[#181a26] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#11131d] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#141624] text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Joined</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading accounts...
                  </td>
                </tr>
              ) : paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-850/50">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img
                        src={
                          user.avatar_url ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                            user.full_name || 'U'
                          )}`
                        }
                        alt="Avatar"
                        className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700"
                      />
                      <div>
                        <p className="font-bold text-white text-xs">{user.full_name || 'Unnamed Member'}</p>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{user.email}</td>

                    <td className="py-3 px-4">
                      {user.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          <Shield className="w-3 h-3 text-rose-400" />
                          <span>Admin</span>
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <select
                            id={`role-select-${user.id}`}
                            value={user.role}
                            disabled={updatingRole || loading}
                            onChange={(e) => handleRoleSelectChange(user, e.target.value as 'user' | 'manager')}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold focus:outline-none border transition-colors disabled:opacity-50 ${
                              user.role === 'manager'
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            }`}
                          >
                            <option value="user" className="bg-[#181a26] text-emerald-300">User</option>
                            <option value="manager" className="bg-[#181a26] text-indigo-300">Manager</option>
                          </select>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 font-medium ${
                          user.is_active ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.is_active ? 'bg-emerald-400' : 'bg-rose-400'
                          }`}
                        />
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-400">{formatTimeAgo(user.created_at)}</td>

                    <td className="py-3 px-4 text-right">
                      {user.role === 'admin' ? (
                        <span className="text-[11px] text-slate-400 italic">Protected</span>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={togglingId === user.id}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                            user.is_active
                              ? 'bg-rose-950/40 text-rose-400 hover:bg-rose-900/50 border border-rose-900/40'
                              : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 border border-emerald-900/40'
                          }`}
                        >
                          {togglingId === user.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                          ) : user.is_active ? (
                            'Deactivate'
                          ) : (
                            'Activate'
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    No matching user accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filtered.length > pageSize && (
          <div className="px-4 py-3 border-t border-slate-800 bg-[#141624] flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} members
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-white">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Exact Role Change Confirmation Modal */}
      {confirmModalUser && pendingNewRole && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#161824] border border-slate-700 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <ArrowUpDown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {pendingNewRole === 'manager'
                    ? 'Make this user a Manager?'
                    : 'Remove Manager privileges from this user?'}
                </h3>
                <p className="text-xs text-slate-400">Database Role Update Confirmation</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              {pendingNewRole === 'manager' ? (
                <>
                  Confirm promoting <span className="font-bold text-white">{confirmModalUser.full_name || confirmModalUser.email}</span> to <b>Manager</b>. They will receive access to the Manager Portal (`/manager`) and video uploading permissions.
                </>
              ) : (
                <>
                  Confirm demoting <span className="font-bold text-white">{confirmModalUser.full_name || confirmModalUser.email}</span> to <b>User</b>. Manager portal access and upload permissions will be revoked.
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmModalUser(null);
                  setPendingNewRole(null);
                }}
                disabled={updatingRole}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-role-change-btn"
                onClick={confirmRoleChange}
                disabled={updatingRole}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-900/40 transition-all flex items-center gap-2"
              >
                {updatingRole ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating role...</span>
                  </>
                ) : (
                  <span>Confirm</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

