import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Package,
  Truck,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Users,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { dashboardApi } from '../../api/dashboard';
import { StatCard } from '../../components/ui/StatCard';
import { clsx } from 'clsx';

const PERIODS = [
  { label: 'Today',    value: 'today'    },
  { label: 'Yesterday',value: 'yesterday'},
  { label: 'Week',     value: 'week'     },
  { label: 'Month',    value: 'month'    },
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
}

export function DashboardPage() {
  const [period, setPeriod] = useState('week');

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard', period],
    queryFn: () => dashboardApi.getSummary(period),
    staleTime: 1000 * 60 * 5,
  });

  const stats = dashboardData?.data;

  type DispatchesByDay = { date: string; count: number };
  const dispatchesData = stats?.charts?.dispatches_by_day;
  const rawChartData: DispatchesByDay[] = dispatchesData
    ? (Array.isArray(dispatchesData)
        ? dispatchesData
        : Object.entries(dispatchesData).map(([date, count]) => ({
            date,
            count: Number(count),
          })))
    : [];

  const chartData = rawChartData.map((d) => ({
    date: formatDate(d.date),
    count: d.count,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={clsx(
              'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
              period === p.value
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Deliveries"
          value={isLoading ? '—' : (stats?.dispatches?.total ?? 0).toLocaleString()}
          icon={Package}
          iconColor="text-brand-500"
          iconBg="bg-brand-50"
          loading={isLoading}
        />
        <StatCard
          label="Total Revenue"
          value={isLoading ? '—' : formatCurrency(stats?.dispatches?.revenue ?? 0)}
          icon={DollarSign}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          loading={isLoading}
        />
        <StatCard
          label="Active Dispatchers"
          value={isLoading ? '—' : (stats?.dispatchers?.active ?? 0)}
          icon={Truck}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          loading={isLoading}
        />
        <StatCard
          label="Total Dispatchers"
          value={isLoading ? '—' : (stats?.dispatchers?.total ?? 0)}
          icon={Users}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          loading={isLoading}
        />
      </div>

      {/* Chart + mini stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar chart */}
        <div className="card p-5 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="section-title">Delivery Volumes</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {stats?.period.from && stats?.period.to
                  ? `${stats.period.from} -> ${stats.period.to}`
                  : 'Loading...'}
              </p>
            </div>
            <TrendingUp className="w-4 h-4 text-slate-300" />
          </div>
          {isLoading ? (
            <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={20}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                  }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="count" name="Deliveries" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              No data for this period
            </div>
          )}
        </div>

        {/* Right mini stats column */}
        <div className="space-y-3">
          {/* Delivery breakdown */}
          <div className="card p-5">
            <p className="section-title mb-3">Delivery Status</p>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                <MiniStat
                  icon={CheckCircle}
                  label="Delivered"
                  value={stats?.dispatches?.completed ?? 0}
                  color="text-emerald-600"
                  bg="bg-emerald-50"
                />
                <MiniStat
                  icon={Clock}
                  label="Pending"
                  value={stats?.dispatches?.pending ?? 0}
                  color="text-amber-600"
                  bg="bg-amber-50"
                />
                <MiniStat
                  icon={XCircle}
                  label="Cancelled"
                  value={stats?.dispatches?.cancelled ?? 0}
                  color="text-red-500"
                  bg="bg-red-50"
                />
              </div>
            )}
          </div>

          {/* Dispatcher stats */}
          <div className="card p-5">
            <p className="section-title mb-3">Dispatchers</p>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                <MiniStat
                  icon={Users}
                  label="Total"
                  value={stats?.dispatchers?.total ?? 0}
                  color="text-slate-600"
                  bg="bg-slate-100"
                />
                <MiniStat
                  icon={Truck}
                  label="Active"
                  value={stats?.dispatchers?.active ?? 0}
                  color="text-emerald-600"
                  bg="bg-emerald-50"
                />
                <MiniStat
                  icon={CheckCircle}
                  label="New"
                  value={stats?.dispatchers?.new ?? 0}
                  color="text-blue-500"
                  bg="bg-blue-50"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.FC<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', bg)}>
        <Icon className={clsx('w-3.5 h-3.5', color)} />
      </div>
      <span className="text-sm text-slate-600 flex-1">{label}</span>
      <span className="text-sm font-semibold text-slate-800 tabular-nums">
        {value.toLocaleString()}
      </span>
    </div>
  );
}
