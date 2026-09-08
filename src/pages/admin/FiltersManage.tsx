import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  Save,
  Loader2,
  RefreshCw,
  Sparkles,
  Layers,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { VideoFilter, VideoFilterOption, FilterType } from '../../types';
import { filterService } from '../../services/filterService';
import { settingsService } from '../../services/settingsService';
import { useToast } from '../../components/common/Toast';

export const FiltersManage: React.FC = () => {
  const { showToast } = useToast();
  const [filters, setFilters] = useState<VideoFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Group modal / form state
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupSlug, setGroupSlug] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupType, setGroupType] = useState<FilterType>('single');
  const [groupEnabled, setGroupEnabled] = useState(true);

  // Delete confirmation modal state
  const [deleteConfirmFilter, setDeleteConfirmFilter] = useState<VideoFilter | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Option modal / inline state
  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
  const [activeFilterForOption, setActiveFilterForOption] = useState<VideoFilter | null>(null);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [optionLabel, setOptionLabel] = useState('');
  const [optionValue, setOptionValue] = useState('');
  const [optionEnabled, setOptionEnabled] = useState(true);

  // Load filters on mount
  const loadFilters = async () => {
    setLoading(true);
    try {
      const data = await filterService.getFilters(true);
      setFilters(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load filters', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilters();
  }, []);

  // Open Create/Edit Group Modal
  const openCreateGroup = () => {
    setEditingGroupId(null);
    setGroupName('');
    setGroupSlug('');
    setGroupDescription('');
    setGroupType('single');
    setGroupEnabled(true);
    setIsGroupModalOpen(true);
  };

  const openEditGroup = (filter: VideoFilter) => {
    setEditingGroupId(filter.id);
    setGroupName(filter.name);
    setGroupSlug(filter.slug);
    setGroupDescription(filter.description || '');
    setGroupType(filter.filter_type || 'single');
    setGroupEnabled(filter.enabled);
    setIsGroupModalOpen(true);
  };

  // Submit Filter Group
  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      showToast('Filter Heading is required', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingGroupId) {
        // Update existing filter
        await filterService.updateFilter(editingGroupId, {
          name: groupName.trim(),
          slug: groupSlug.trim() || undefined,
          description: groupDescription.trim(),
          filter_type: groupType,
          enabled: groupEnabled,
        });
        showToast('Filter group updated successfully', 'success');
        await settingsService.logAdminAction('Updated filter group', 'filter', editingGroupId, groupName.trim());
      } else {
        // Create new filter
        const newFilter = await filterService.createFilter({
          name: groupName.trim(),
          slug: groupSlug.trim() || undefined,
          description: groupDescription.trim(),
          filter_type: groupType,
          enabled: groupEnabled,
          sort_order: filters.length + 1,
        });
        showToast('Filter group created successfully', 'success');
        await settingsService.logAdminAction('Created new filter group', 'filter', newFilter.id, groupName.trim());
      }
      setIsGroupModalOpen(false);
      await loadFilters();
    } catch (err: any) {
      showToast(err.message || 'Failed to save filter group', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Toggle filter group enabled state
  const handleToggleFilterEnabled = async (filter: VideoFilter) => {
    const nextState = !filter.enabled;
    // Optimistic UI
    setFilters((prev) =>
      prev.map((f) => (f.id === filter.id ? { ...f, enabled: nextState } : f))
    );

    try {
      await filterService.updateFilter(filter.id, { enabled: nextState });
      showToast(`${filter.name} is now ${nextState ? 'enabled' : 'disabled'}`, 'info');
      await settingsService.logAdminAction(
        `${nextState ? 'Enabled' : 'Disabled'} filter group`,
        'filter',
        filter.id,
        filter.name
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
      await loadFilters();
    }
  };

  // Reorder Filter Groups (Move Up / Down)
  const handleMoveGroup = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === filters.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newFilters = [...filters];
    const temp = newFilters[index];
    newFilters[index] = newFilters[targetIndex];
    newFilters[targetIndex] = temp;

    setFilters(newFilters);

    try {
      const orderedIds = newFilters.map((f) => f.id);
      await filterService.reorderFilters(orderedIds);
      showToast('Filter order updated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to reorder filters', 'error');
      await loadFilters();
    }
  };

  // Confirm Delete Group
  const handleDeleteGroup = async () => {
    if (!deleteConfirmFilter) return;

    setIsDeleting(true);
    try {
      await filterService.deleteFilter(deleteConfirmFilter.id);
      showToast(`Deleted filter "${deleteConfirmFilter.name}"`, 'success');
      await settingsService.logAdminAction(
        'Deleted filter group',
        'filter',
        deleteConfirmFilter.id,
        deleteConfirmFilter.name
      );
      setDeleteConfirmFilter(null);
      await loadFilters();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete filter', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // -------------------------------------------------------------
  // Filter Options Handlers
  // -------------------------------------------------------------
  const openAddOption = (filter: VideoFilter) => {
    setActiveFilterForOption(filter);
    setEditingOptionId(null);
    setOptionLabel('');
    setOptionValue('');
    setOptionEnabled(true);
    setIsOptionModalOpen(true);
  };

  const openEditOption = (filter: VideoFilter, option: VideoFilterOption) => {
    setActiveFilterForOption(filter);
    setEditingOptionId(option.id);
    setOptionLabel(option.label);
    setOptionValue(option.value);
    setOptionEnabled(option.enabled);
    setIsOptionModalOpen(true);
  };

  const handleSaveOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFilterForOption || !optionLabel.trim()) {
      showToast('Option label is required', 'error');
      return;
    }

    const val = optionValue.trim() || optionLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

    setSaving(true);
    try {
      if (editingOptionId) {
        await filterService.updateFilterOption(editingOptionId, {
          label: optionLabel.trim(),
          value: val,
          enabled: optionEnabled,
        });
        showToast('Option updated', 'success');
      } else {
        await filterService.createFilterOption({
          filter_id: activeFilterForOption.id,
          label: optionLabel.trim(),
          value: val,
          enabled: optionEnabled,
          sort_order: (activeFilterForOption.options || []).length + 1,
        });
        showToast('Option added', 'success');
      }
      setIsOptionModalOpen(false);
      await loadFilters();
    } catch (err: any) {
      showToast(err.message || 'Failed to save option', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleOptionEnabled = async (option: VideoFilterOption) => {
    const nextState = !option.enabled;
    try {
      await filterService.updateFilterOption(option.id, { enabled: nextState });
      showToast(`Option ${nextState ? 'enabled' : 'disabled'}`, 'info');
      await loadFilters();
    } catch (err: any) {
      showToast(err.message || 'Failed to update option', 'error');
    }
  };

  const handleDeleteOption = async (optionId: string, label: string) => {
    if (!window.confirm(`Delete option "${label}"?`)) return;

    try {
      await filterService.deleteFilterOption(optionId);
      showToast(`Option "${label}" deleted`, 'success');
      await loadFilters();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete option', 'error');
    }
  };

  const handleMoveOption = async (
    filter: VideoFilter,
    optionIndex: number,
    direction: 'up' | 'down'
  ) => {
    const opts = [...(filter.options || [])];
    if (
      (direction === 'up' && optionIndex === 0) ||
      (direction === 'down' && optionIndex === opts.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === 'up' ? optionIndex - 1 : optionIndex + 1;
    const temp = opts[optionIndex];
    opts[optionIndex] = opts[targetIndex];
    opts[targetIndex] = temp;

    try {
      const orderedIds = opts.map((o) => o.id);
      await filterService.reorderFilterOptions(filter.id, orderedIds);
      await loadFilters();
    } catch (err: any) {
      showToast(err.message || 'Failed to reorder options', 'error');
    }
  };

  return (
    <div id="admin-filters-manage-page" className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Sliders className="w-7 h-7 text-rose-500" />
            <span>Filter Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage the filters and filter options displayed on the public Videos page.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadFilters}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reload Filters"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="btn-add-filter-group"
            onClick={openCreateGroup}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-950/40 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Filter</span>
          </button>
        </div>
      </div>

      {/* Live Preview Box */}
      <div className="p-6 rounded-3xl bg-[#10121d] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Sparkles className="w-4 h-4 text-rose-500" />
            <span>Public Filter Bar Preview</span>
          </div>
          <span className="text-[11px] text-slate-500">
            Real-time appearance on the User Videos catalog
          </span>
        </div>

        <div className="space-y-3 p-4 bg-[#090a10] rounded-2xl border border-slate-800/80">
          {filters.filter((f) => f.enabled).length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-3">
              No filters currently enabled. Enable or add filters below to see them on the public page.
            </p>
          ) : (
            filters
              .filter((f) => f.enabled)
              .map((filter) => {
                const enabledOpts = (filter.options || []).filter((o) => o.enabled);
                return (
                  <div key={filter.id} className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] shrink-0 mr-1 flex items-center gap-1.5">
                      <Tag className="w-3 h-3 text-rose-500" />
                      {filter.name}:
                    </span>
                    <button className="px-3 py-1 rounded-lg bg-rose-600 text-white font-medium text-xs shadow-sm">
                      All
                    </button>
                    {enabledOpts.length === 0 ? (
                      <span className="text-slate-500 text-[11px] italic">(No active options)</span>
                    ) : (
                      enabledOpts.map((opt) => (
                        <button
                          key={opt.id}
                          className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-medium text-xs border border-slate-700/50 transition-colors"
                        >
                          {opt.label}
                        </button>
                      ))
                    )}
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Filter Groups List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-rose-500" />
            <span>Configured Filter Groups ({filters.length})</span>
          </h2>
          <span className="text-xs text-slate-400">
            Drag or use arrows to change display order
          </span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-slate-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filters.length === 0 ? (
          <div className="text-center py-16 bg-[#11131c] border border-slate-800 rounded-3xl p-8 space-y-4">
            <Sliders className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No filter groups defined</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Create your first filter group (such as "Content Type", "Language", "Quality", "Era", or "Choose Your Mood") to empower visitors to filter videos.
            </p>
            <button
              onClick={openCreateGroup}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Filter Group
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filters.map((filter, index) => {
              const activeCount = (filter.options || []).filter((o) => o.enabled).length;
              const totalCount = (filter.options || []).length;

              return (
                <div
                  key={filter.id}
                  id={`filter-card-${filter.id}`}
                  className={`p-6 rounded-3xl border transition-all ${
                    filter.enabled
                      ? 'bg-[#11131d] border-slate-800'
                      : 'bg-slate-950/60 border-slate-800/50 opacity-70'
                  }`}
                >
                  {/* Group Header Card */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-mono text-xs flex items-center justify-center font-bold">
                          {index + 1}
                        </span>
                        <h3 className="text-base font-bold text-white">{filter.name}</h3>
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-mono">
                          slug: {filter.slug}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-rose-950/60 text-rose-400 border border-rose-800/40 text-[10px] uppercase font-bold">
                          {filter.filter_type}
                        </span>
                      </div>
                      {filter.description && (
                        <p className="text-xs text-slate-400 pl-9">{filter.description}</p>
                      )}
                    </div>

                    {/* Group Action Controls */}
                    <div className="flex items-center gap-2 pl-9 md:pl-0 flex-wrap">
                      {/* Reorder Up */}
                      <button
                        onClick={() => handleMoveGroup(index, 'up')}
                        disabled={index === 0}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-colors"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>

                      {/* Reorder Down */}
                      <button
                        onClick={() => handleMoveGroup(index, 'down')}
                        disabled={index === filters.length - 1}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-colors"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>

                      {/* Enable/Disable toggle */}
                      <button
                        onClick={() => handleToggleFilterEnabled(filter)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                          filter.enabled
                            ? 'bg-emerald-950/30 text-emerald-300 border-emerald-800/40 hover:bg-emerald-900/40'
                            : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800'
                        }`}
                      >
                        {filter.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{filter.enabled ? 'Enabled' : 'Disabled'}</span>
                      </button>

                      {/* Edit Group */}
                      <button
                        onClick={() => openEditGroup(filter)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      {/* Delete Group */}
                      <button
                        onClick={() => setDeleteConfirmFilter(filter)}
                        className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/30 transition-colors"
                        title="Delete Filter Group"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Options Sub-Section */}
                  <div className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Filter Options ({activeCount}/{totalCount} Active)
                      </span>
                      <button
                        onClick={() => openAddOption(filter)}
                        className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Option</span>
                      </button>
                    </div>

                    {(!filter.options || filter.options.length === 0) ? (
                      <p className="text-xs text-slate-500 italic py-2">
                        No options added to this group yet. Click &quot;Add Option&quot; above to create choices.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {filter.options.map((opt, optIndex) => (
                          <div
                            key={opt.id}
                            className={`p-3 rounded-2xl border flex items-center justify-between gap-2 transition-all ${
                              opt.enabled
                                ? 'bg-[#171926] border-slate-800 text-slate-200'
                                : 'bg-slate-900/40 border-slate-800/40 text-slate-500 line-through'
                            }`}
                          >
                            <div className="truncate space-y-0.5">
                              <p className="text-xs font-bold truncate">{opt.label}</p>
                              <p className="text-[10px] font-mono text-slate-500 truncate">
                                val: {opt.value}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {/* Move option up/down */}
                              <button
                                onClick={() => handleMoveOption(filter, optIndex, 'up')}
                                disabled={optIndex === 0}
                                className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                                title="Move option up"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleMoveOption(filter, optIndex, 'down')}
                                disabled={optIndex === (filter.options?.length || 1) - 1}
                                className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                                title="Move option down"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>

                              {/* Toggle option */}
                              <button
                                onClick={() => handleToggleOptionEnabled(opt)}
                                className={`p-1 rounded ${
                                  opt.enabled ? 'text-emerald-400' : 'text-slate-500'
                                }`}
                                title={opt.enabled ? 'Disable option' : 'Enable option'}
                              >
                                {opt.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              </button>

                              {/* Edit option */}
                              <button
                                onClick={() => openEditOption(filter, opt)}
                                className="p-1 text-slate-400 hover:text-white"
                                title="Edit option"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete option */}
                              <button
                                onClick={() => handleDeleteOption(opt.id, opt.label)}
                                className="p-1 text-rose-400 hover:text-rose-300"
                                title="Delete option"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================= */}
      {/* 1. Filter Group Modal (Create / Edit) */}
      {/* ============================================================= */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#11131e] border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {editingGroupId ? 'Edit Filter Group' : 'Create New Filter Group'}
              </h3>
              <button
                onClick={() => setIsGroupModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Filter Heading / Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Content Type, Audio Language, Choose Your Mood, Release Era"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Slug / Query Key
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. language, mood, era"
                    value={groupSlug}
                    onChange={(e) => setGroupSlug(e.target.value)}
                    className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Selection Mode
                  </label>
                  <select
                    value={groupType}
                    onChange={(e) => setGroupType(e.target.value as FilterType)}
                    className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="single">Single Select (Radio/Tab)</option>
                    <option value="multi">Multi Select (Pill/Tag)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Brief hint or subtitle for the user"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="group-enabled-chk"
                  checked={groupEnabled}
                  onChange={(e) => setGroupEnabled(e.target.checked)}
                  className="w-4 h-4 accent-rose-500 rounded"
                />
                <label htmlFor="group-enabled-chk" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Enable filter on public website immediately
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingGroupId ? 'Update Filter' : 'Create Filter'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 2. Filter Option Modal (Create / Edit) */}
      {/* ============================================================= */}
      {isOptionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#11131e] border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingOptionId ? 'Edit Filter Option' : 'Add Filter Option'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Group: <b className="text-rose-400">{activeFilterForOption?.name}</b>
                </p>
              </div>
              <button
                onClick={() => setIsOptionModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOption} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Option Label *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tamil, 4K Ultra HD, 2026+, Comedy"
                  value={optionLabel}
                  onChange={(e) => setOptionLabel(e.target.value)}
                  className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Option Value / Match Tag
                </label>
                <input
                  type="text"
                  placeholder="e.g. tamil, 4k, 2026, comedy (matches video tags/category)"
                  value={optionValue}
                  onChange={(e) => setOptionValue(e.target.value)}
                  className="w-full bg-[#181a26] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Leave blank to auto-generate from label.
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="option-enabled-chk"
                  checked={optionEnabled}
                  onChange={(e) => setOptionEnabled(e.target.checked)}
                  className="w-4 h-4 accent-rose-500 rounded"
                />
                <label htmlFor="option-enabled-chk" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Enabled (visible in catalog options)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOptionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingOptionId ? 'Save Option' : 'Add Option'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 3. Delete Filter Confirmation Modal */}
      {/* ============================================================= */}
      {deleteConfirmFilter && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#11131e] border border-rose-600/30 rounded-3xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Delete Filter Group?</h3>
            </div>

            <div className="text-xs text-slate-300 space-y-2">
              <p>
                Are you sure you want to delete <b className="text-white">&ldquo;{deleteConfirmFilter.name}&rdquo;</b>?
              </p>
              <p className="text-slate-400">
                This will remove the filter group and its options from the catalog filter bar.
                <br />
                <span className="text-emerald-400 font-bold">Note:</span> This will <b>NOT</b> delete or modify any videos in your library.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmFilter(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteGroup}
                disabled={isDeleting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Delete Filter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
