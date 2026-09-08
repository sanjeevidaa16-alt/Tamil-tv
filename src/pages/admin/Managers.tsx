import React, { useState, useEffect } from 'react';
import { UserCheck, Search, Shield, Briefcase, UserX, Loader2, Info } from 'lucide-react';
import { Profile } from '../../types';
import { userService } from '../../services/userService';
import { useToast } from '../../components/common/Toast';

export const ManagersManage: React.FC = () => {
  const { showToast } = useToast();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await userService.getAllUsers();
      setProfiles(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load manager accounts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRoleChange = async (user: Profile, newRole: 'manager' | 'user') => {
    if (user.role === 'admin') {
      showToast('Super Admin role cannot be modified', 'error');
      return;
    }

    setUpdatingId(user.id);
    try {
      await userService.setUserRole(user.id, newRole);
      showToast(
        `${user.full_name || user.email} is now ${
          newRole === 'manager' ? 'a Manager (Upload Privileges Granted)' : 'a Standard User'
        }`,
        'success'
      );
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update role', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = profiles.filter((p) => {
    return (
      (p.full_name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (p.email?.toLowerCase().includes(search.toLowerCase()) ?? false)
    );
  });

  const activeManagersCount = profiles.filter((p) => p.role === 'manager').length;

  return (
    <div id="admin-managers-manage" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-indigo-400" />
            <span>Manager Delegations</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Grant or revoke exclusive video upload & asset management privileges
          </p>
        </div>

        <div className="px-4 py-2 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-indigo-200">
            {activeManagersCount} Active Manager{activeManagersCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Role Explainer Callout */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-start gap-3 text-xs text-slate-300 leading-relaxed">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-white">Manager Role Access Matrix:</p>
          <p className="text-slate-400 mt-0.5">
            Users promoted to <b>Manager</b> gain access to the Manager Studio (`/manager`), enabling them to upload new videos and modify catalog entries. Managers are <b>strictly forbidden</b> from viewing user accounts, assigning roles, or accessing cloud database settings.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-4 bg-[#11131c] border border-slate-800 rounded-2xl">
        <div className="relative">
          <input
            type="text"
            placeholder="Search member by name or email to adjust role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Managers & Users Table */}
      <div className="bg-[#11131d] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#141624] text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Member</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Current Role</th>
                <th className="py-3.5 px-4">Upload Permission</th>
                <th className="py-3.5 px-4 text-right">Role Assignment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Loading directory...
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((user) => (
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
                        <p className="font-bold text-white text-xs">{user.full_name || 'Unnamed'}</p>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{user.email}</td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          user.role === 'admin'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : user.role === 'manager'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {user.role === 'admin' ? (
                          <Shield className="w-3 h-3" />
                        ) : user.role === 'manager' ? (
                          <Briefcase className="w-3 h-3" />
                        ) : null}
                        <span>{user.role}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {user.role === 'admin' || user.role === 'manager' ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          Authorized Uploader
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium">Viewing Only (No Uploads)</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {user.role === 'admin' ? (
                        <span className="text-[10px] text-slate-500 italic">Super Admin (Permanent)</span>
                      ) : user.role === 'manager' ? (
                        <button
                          id={`revoke-manager-${user.id}`}
                          onClick={() => handleRoleChange(user, 'user')}
                          disabled={updatingId === user.id}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-900/40 text-xs font-semibold transition-all disabled:opacity-50"
                        >
                          {updatingId === user.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                          ) : (
                            'Revoke Manager'
                          )}
                        </button>
                      ) : (
                        <button
                          id={`make-manager-${user.id}`}
                          onClick={() => handleRoleChange(user, 'manager')}
                          disabled={updatingId === user.id}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-950/40 transition-all disabled:opacity-50"
                        >
                          {updatingId === user.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                          ) : (
                            'Make Manager'
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
