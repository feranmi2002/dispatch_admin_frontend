import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, Wifi, Clock, Shield, ChevronRight, Filter } from 'lucide-react';
import { dispatchersApi } from '../../api/dispatchers';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { SearchInput } from '../../components/ui/SearchInput';
import type { DispatcherFilters } from '../../types';
import { clsx } from 'clsx';

export function DispatchersPage() {
  const [filters, setFilters] = useState<DispatcherFilters>({ page: 1, per_page: 25 });
  const [showFilters, setShowFilters] = useState(false);

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dispatcher-stats'],
    queryFn: () => dispatchersApi.getStats(),
    staleTime: 1000 * 60 * 5,
  });

  const { data, isLoading: listLoading, isFetching } = useQuery({
    queryKey: ['dispatchers', filters],
    queryFn: () => dispatchersApi.list(filters),
    staleTime: 1000 * 60 * 2,
    placeholderData: (prev) => prev,
  });

  const stats = statsData?.data;
  const listData = data?.data;
  const dispatchers = listData?.data ?? [];

  const setFilter = (key: keyof DispatcherFilters, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total"    value={statsLoading ? '—' : (stats?.total ?? 0)}            icon={Users}   loading={statsLoading} iconColor="text-slate-600"  iconBg="bg-slate-100" />
        <StatCard label="Online"   value={statsLoading ? '—' : (stats?.online ?? 0)}           icon={Wifi}    loading={statsLoading} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <StatCard label="Pending"  value={statsLoading ? '—' : (stats?.pending_approval ?? 0)} icon={Clock}   loading={statsLoading} iconColor="text-amber-600"  iconBg="bg-amber-50" />
        <StatCard label="Suspended"value={statsLoading ? '—' : (stats?.suspended ?? 0)}        icon={Shield}  loading={statsLoading} iconColor="text-red-500"    iconBg="bg-red-50" />
      </div>

      {/* Filters row */}
      <div className="card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <SearchInput
            value={filters.search ?? ''}
            onChange={(v) => setFilter('search', v || undefined)}
            placeholder="Search name or phone..."
            className="w-64"
          />

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx('btn-secondary gap-2', showFilters && 'bg-slate-100')}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
          </button>

          {/* Quick filter chips */}
          {(['', 'ONLINE', 'OFFLINE'] as const).map((status) => (
            <button
              key={status || 'all'}
              onClick={() => setFilter('status', status || undefined)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                (filters.status ?? '') === status
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              )}
            >
              {status || 'All'}
            </button>
          ))}

          <div className="ml-auto flex gap-2">
            {(['', '1', '0'] as const).map((val) => {
              const labels = { '': 'All', '1': 'Approved', '0': 'Unapproved' };
              return (
                <button
                  key={val}
                  onClick={() => setFilter('is_approved', val || undefined)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    (filters.is_approved ?? '') === val
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  )}
                >
                  {labels[val]}
                </button>
              );
            })}
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3 flex-wrap animate-fade-in">
            <div>
              <label className="label text-[10px]">From</label>
              <input
                type="date"
                className="input h-8 text-xs"
                value={filters.from ?? ''}
                onChange={(e) => setFilter('from', e.target.value || undefined)}
              />
            </div>
            <div>
              <label className="label text-[10px]">To</label>
              <input
                type="date"
                className="input h-8 text-xs"
                value={filters.to ?? ''}
                onChange={(e) => setFilter('to', e.target.value || undefined)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <div className={clsx('transition-opacity', isFetching ? 'opacity-60' : 'opacity-100')}>
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Dispatcher
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
                  Location
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">
                  Vehicle
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">
                  Joined
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {listLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
                          <div className="space-y-1">
                            <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
                            <div className="h-2.5 w-16 bg-slate-100 rounded animate-pulse" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-5 w-16 bg-slate-100 rounded-full animate-pulse" />
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="h-3 w-16 bg-slate-100 rounded animate-pulse" />
                      </td>
                      <td className="px-4 py-3" />
                    </tr>
                  ))
                : dispatchers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                      No dispatchers found
                    </td>
                  </tr>
                ) : (
                  dispatchers.map((d) => {
                    const isOnline = d.status?.toLowerCase() === 'online' || d.user?.is_online;
                    const lastSeenDate = d.user?.updated_at || d.updated_at;
                    const lastSeen = lastSeenDate ? new Date(lastSeenDate).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown';
                    const statusText = isOnline ? 'Online' : `Offline (Seen: ${lastSeen})`;
                    
                    return (
                      <tr
                        key={d.id}
                        className="border-b border-slate-50 hover:bg-slate-50 transition-colors group"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {d.image_url ? (
                              <img
                                src={d.image_url}
                                alt={d.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                                <span className="text-xs font-semibold text-brand-600">
                                  {d.name.charAt(0)}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-slate-800">{d.name}</p>
                              <p className="text-xs text-slate-400">{d.phone_number}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-slate-500 text-xs">
                          {d.city}, {d.state}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <Badge
                              label={statusText}
                              variant={isOnline ? 'emerald' : 'slate'}
                              dot
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-slate-500 text-xs">
                          {d.vehicle_make} {d.vehicle_model} Â· {d.license_plate}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-slate-400 text-xs">
                          {new Date(d.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/dispatchers/${d.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
                          >
                            View
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
            </tbody>
          </table>
        </div>

        {listData && (
          <div className="px-4 divider">
            <Pagination
              currentPage={listData.current_page}
              lastPage={listData.last_page}
              total={listData.total}
              from={listData.from}
              to={listData.to}
              onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
