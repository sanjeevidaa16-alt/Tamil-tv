import React, { useState, useEffect } from 'react';
import { History, Search, Filter, Shield, Clock, RefreshCw, FileText, UserCheck, Settings, Film } from 'lucide-react';
import { AdminActivityLog } from '../../types';
import { settingsService } from '../../services/settingsService';
import { formatTimeAgo } from '../../utils/formatters';

export const ActivityLog: React.FC = () => {
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await settingsService.getActivityLogs(100);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details?.toLowerCase().includes(search.toLowerCase()) ||
      log.admin_name?.toLowerCase().includes(search.toLowerCase());

    const matchesType = selectedType === 'all' || log.target_type === selectedType;

    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Film className="w-3.5 h-3.5 text-rose-400" />;
      case 'user':
        return <UserCheck className="w-3.5 h-3.5 text-indigo-400" />;
      case 'settings':
        return <Settings className="w-3.5 h-3.5 text-amber-400" />;
      case 'category':
        return <FileText className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Shield className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div id="admin-activity-view" className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <History className="w-7 h-7 text-rose-500" />
            <span>Administrator Audit & Activity Logs</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident audit trails of video uploads, status mutations, role escalations, and system updates
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#11131c] border border-slate-800 rounded-2xl">
        <div className="sm:col-span-2 relative">
          <input
            id="activity-log-search"
            type="text"
            placeholder="Search activity records by action, admin, or detail..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <select
          id="activity-log-type-filter"
          value={selectedType}
          onChange={(e) => {
            setSelectedType(e.target.value);
            setPage(1);
          }}
          className="bg-[#181a26] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
        >
          <option value="all">All Action Categories</option>
          <option value="video">Video Catalog Actions</option>
          <option value="user">User & Role Mutations</option>
          <option value="category">Category Changes</option>
          <option value="settings">System & Security Settings</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-[#11131d] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#141624] text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Administrator</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Parameters & Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-sans">
                    Loading audit stream...
                  </td>
                </tr>
              ) : paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{formatTimeAgo(log.created_at)}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white font-sans font-bold">
                      {log.admin_name || 'Super Admin'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-800 text-[10px] text-slate-300 font-sans uppercase font-bold">
                        {getTypeIcon(log.target_type)}
                        <span>{log.target_type}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans font-semibold text-rose-300">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-slate-400 truncate max-w-xs font-sans text-xs">
                      {log.details || 'No additional parameters'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-sans text-xs">
                    No activity logs recorded matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {Math.min((page - 1) * pageSize + 1, filteredLogs.length)} -{' '}
              {Math.min(page * pageSize, filteredLogs.length)} of {filteredLogs.length} actions
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
