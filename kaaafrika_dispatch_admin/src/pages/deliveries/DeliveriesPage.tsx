import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Package, CheckCircle, XCircle, Clock, DollarSign, Filter } from 'lucide-react';
import { deliveriesApi } from '../../api/deliveries';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { deliveryStatusBadge, paymentStatusBadge } from '../../components/ui/badgeUtils';
import { Pagination } from '../../components/ui/Pagination';
import { SearchInput } from '../../components/ui/SearchInput';
import type { DeliveryFilters, DeliveryStatus, PaymentStatus } from '../../types';
import { clsx } from 'clsx';

const STATUS_OPTIONS: { label: string; value: DeliveryStatus | '' }[] = [
  { label: 'All',        value: ''          },
  { label: 'Pending',    value: 'pending'   },
  { label: 'Assigned',   value: 'assigned'  },
  { label: 'Accepted',   value: 'accepted'  },
  { label: 'Picking up', value: 'picked_up' },
  { label: 'Delivering', value: 'delivering'},
  { label: 'Delivered',  value: 'delivered' },
  { label: 'Cancelled',  value: 'cancelled' },
];

const PAYMENT_OPTIONS: { label: string; value: PaymentStatus | '' }[] = [
  { label: 'All',     value: ''        },
  { label: 'Paid',    value: 'paid'    },
  { label: 'Pending', value: 'pending' },
  { label: 'Failed',  value: 'failed'  },
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);
}

export function DeliveriesPage() {
  const [filters, setFilters] = useState<DeliveryFilters>({ page: 1, per_page: 25 });
  const [showFilters, setShowFilters] = useState(false);

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['delivery-stats', 'week'],
    queryFn: () => deliveriesApi.getStats('week'),
    staleTime: 1000 * 60 * 5,
  });

  const { data, isLoading: listLoading, isFetching } = useQuery({
    queryKey: ['deliveries', filters],
    queryFn: () => deliveriesApi.list(filters),
    staleTime: 1000 * 60 * 2,
    placeholderData: (prev) => prev,
  });

  const stats = statsData?.data;
  const listData = data?.data;
  const deliveries = listData?.data ?? [];

  const setFilter = <K extends keyof DeliveryFilters>(key: K, value: DeliveryFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const totalCount = stats ? Object.values(stats.status_counts).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Delivery History</h2>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total (Week)"  value={statsLoading ? 'â' : totalCount}                           icon={Package}      loading={statsLoading} iconColor="text-brand-500" iconBg="bg-brand-50" />
        <StatCard label="Revenue"       value={statsLoading ? 'â' : formatCurrency(stats?.total_revenue ?? 0)} icon={DollarSign}   loading={statsLoading} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <StatCard label="Delivered"     value={statsLoading ? 'â' : (stats?.status_counts.delivered ?? 0)} icon={CheckCircle}  loading={statsLoading} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <StatCard label="Cancelled"     value={statsLoading ? 'â' : (stats?.status_counts.cancelled ?? 0)} icon={XCircle}      loading={statsLoading} iconColor="text-red-500"    iconBg="bg-red-50" />
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <SearchInput
            value={filters.search ?? ''}
            onChange={(v) => setFilter('search', v || undefined)}
            placeholder="Search tracking code, sender..."
            className="w-72"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx('btn-secondary gap-2 text-sm', showFilters && 'bg-slate-100')}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 animate-fade-in">
            {/* Status chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 font-medium w-16">Status</span>
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value || 'all'}
                  onClick={() => setFilter('status', opt.value as DeliveryStatus | undefined)}
                  className={clsx(
                    'px-3 py-1 rounded-lg text-xs font-medium border transition-all',
                    (filters.status ?? '') === opt.value
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Payment chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 font-medium w-16">Payment</span>
              {PAYMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value || 'all'}
                  onClick={() => setFilter('payment_status', opt.value as PaymentStatus | undefined)}
                  className={clsx(
                    'px-3 py-1 rounded-lg text-xs font-medium border transition-all',
                    (filters.payment_status ?? '') === opt.value
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <label className="label text-[10px]">From</label>
                <input type="date" className="input h-8 text-xs" value={filters.from ?? ''} onChange={(e) => setFilter('from', e.target.value || undefined)} />
              </div>
              <div>
                <label className="label text-[10px]">To</label>
                <input type="date" className="input h-8 text-xs" value={filters.to ?? ''} onChange={(e) => setFilter('to', e.target.value || undefined)} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <div className={clsx('transition-opacity', isFetching ? 'opacity-60' : 'opacity-100')}>
          <table className="w-full text-sm min-w-[980px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Tracking</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 hidden md:table-cell">Sender</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 hidden lg:table-cell">Route</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 hidden md:table-cell">Payment</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 hidden lg:table-cell">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 hidden lg:table-cell">Dispatcher</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 hidden xl:table-cell">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {listLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-slate-100 rounded animate-pulse w-20" />
                        </td>
                      ))}
                      <td className="px-4 py-3" />
                    </tr>
                  ))
                : deliveries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-400">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                      No deliveries found
                    </td>
                  </tr>
                ) : (
                  deliveries.map((d) => {
                    const statusBadge = deliveryStatusBadge(d.status);
                    const payBadge = paymentStatusBadge(d.payment_status);
                    return (
                      <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">{d.tracking_code}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 hidden md:table-cell">
                          {d.user.first_name} {d.user.last_name}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="text-xs text-slate-500 max-w-[180px]">
                            <p className="truncate">{d.pickup_address}</p>
                            <p className="truncate text-slate-400">
                              {'\u2192'} {d.dropoff_address}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge label={statusBadge.label} variant={statusBadge.variant} dot />
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <Badge label={payBadge.label} variant={payBadge.variant} />
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-xs font-medium text-slate-700">
                          {'\u20A6'}{d.total_amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-500">
                          {d.dispatcher?.name ?? '\u2014'}
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell text-xs text-slate-400">
                          {new Date(d.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                            <Link
                              to={`/deliveries/${d.id}`}
                              className="btn-secondary text-[11px] py-1.5 px-3 whitespace-nowrap"
                            >
                              View Details
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
