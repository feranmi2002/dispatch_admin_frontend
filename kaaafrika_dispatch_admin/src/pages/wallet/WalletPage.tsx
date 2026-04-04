import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wallet, ArrowDownRight, ArrowUpRight, Loader2 } from 'lucide-react';
import { walletApi } from '../../api/wallet';
import { Pagination } from '../../components/ui/Pagination';
import { clsx } from 'clsx';
import { Badge } from '../../components/ui/Badge';
import type { WalletTransaction } from '../../types';

export function WalletPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['wallet-transactions', page],
    queryFn: () => walletApi.getTransactions(page, 15),
    placeholderData: (prev) => prev,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const transactions = (data?.data?.data ?? []) as WalletTransaction[];
  const meta = data?.data;
  const hasPagination = (meta?.last_page ?? 0) > 1;

  const formatCurrency = (n: number | string) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(n));
  }

  return (
    <div className="space-y-5 animate-fade-in w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Wallet Transactions</h2>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Ref / Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">User</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Description</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-500 mx-auto" />
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center text-sm text-slate-400">
                  <Wallet className="w-8 h-8 mx-auto mb-3 text-slate-200" />
                  <p className="font-semibold text-slate-500 mb-1">No Transactions Found</p>
                  <p className="text-xs">There are no wallet transactions to show at this time.</p>
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", tx.transaction_type === 'credit' ? 'bg-emerald-50' : 'bg-red-50')}>
                        {tx.transaction_type === 'credit' ? <ArrowDownRight className="w-4 h-4 text-emerald-500" /> : <ArrowUpRight className="w-4 h-4 text-red-500" />}
                      </div>
                      <div>
                        <p className="font-medium text-slate-700">{tx.reference}</p>
                        <p className="text-[11px] text-slate-400 uppercase tracking-widest">{tx.transaction_type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(tx.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    {tx.wallet?.user ? (
                      <div>
                        <p className="font-medium text-slate-700 line-clamp-1">{tx.wallet.user.first_name} {tx.wallet.user.last_name}</p>
                        <p className="text-xs text-slate-500">{tx.wallet.user.phone_number}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 line-clamp-2 max-w-xs" title={tx.description}>
                    {tx.description || '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={clsx("font-semibold", tx.transaction_type === 'credit' ? 'text-emerald-600' : 'text-slate-700')}>
                      {tx.transaction_type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                    <Badge label={tx.status} variant={tx.status === 'completed' ? 'green' : 'yellow'} className="ml-auto mt-1 !flex !w-max items-center justify-center" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {hasPagination && meta && (
          <div className="border-t border-slate-100 p-4">
            <Pagination
              currentPage={page}
              lastPage={meta.last_page}
              total={meta.total}
              from={meta.from}
              to={meta.to}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
