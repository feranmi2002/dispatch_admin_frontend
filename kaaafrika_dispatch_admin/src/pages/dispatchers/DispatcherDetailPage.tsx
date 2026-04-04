import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Car,
  Package,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  Minus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { dispatchersApi } from '../../api/dispatchers';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import type { DocumentReviewAction } from '../../types';
import { clsx } from 'clsx';

const TABS = ['Profile', 'Documents', 'Vehicle Docs', 'Deliveries', 'Wallet'] as const;
type Tab = (typeof TABS)[number];

export function DispatcherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatcherId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>('Profile');
  const [suspendModal, setSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [walletModal, setWalletModal] = useState<'credit' | 'debit' | null>(null);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletDesc, setWalletDesc] = useState('');
  const [walletPage, setWalletPage] = useState(1);
  const [delivPage, setDelivPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['dispatcher', dispatcherId],
    queryFn: () => dispatchersApi.getOne(dispatcherId),
  });

  const { data: walletData } = useQuery({
    queryKey: ['dispatcher-wallet', dispatcherId, walletPage],
    queryFn: () => dispatchersApi.getWallet(dispatcherId, walletPage),
    enabled: activeTab === 'Wallet',
  });

  const { data: delivData } = useQuery({
    queryKey: ['dispatcher-deliveries', dispatcherId, delivPage],
    queryFn: () => dispatchersApi.getDeliveries(dispatcherId, delivPage),
    enabled: activeTab === 'Deliveries',
  });

  const approveMutation = useMutation({
    mutationFn: () => dispatchersApi.approve(dispatcherId),
    onSuccess: () => {
      toast.success('Dispatcher approved');
      queryClient.invalidateQueries({ queryKey: ['dispatcher', dispatcherId] });
      queryClient.invalidateQueries({ queryKey: ['dispatcher-stats'] });
    },
    onError: () => toast.error('Failed to approve'),
  });

  const suspendMutation = useMutation({
    mutationFn: (reason: string) => dispatchersApi.suspend(dispatcherId, reason),
    onSuccess: () => {
      toast.success('Dispatcher suspended');
      setSuspendModal(false);
      setSuspendReason('');
      queryClient.invalidateQueries({ queryKey: ['dispatcher', dispatcherId] });
    },
    onError: () => toast.error('Failed to suspend'),
  });

  const walletMutation = useMutation({
    mutationFn: ({ type, amount, desc }: { type: 'credit' | 'debit'; amount: number; desc: string }) =>
      type === 'credit'
        ? dispatchersApi.creditWallet(dispatcherId, amount, desc)
        : dispatchersApi.debitWallet(dispatcherId, amount, desc),
    onSuccess: () => {
      toast.success(`Wallet ${walletModal}ed successfully`);
      setWalletModal(null);
      setWalletAmount('');
      setWalletDesc('');
      queryClient.invalidateQueries({ queryKey: ['dispatcher-wallet', dispatcherId] });
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      toast.error(e?.response?.data?.message ?? 'Wallet operation failed');
    },
  });

  const docMutation = useMutation({
    mutationFn: ({
      docId,
      action,
      reason,
      isVehicle,
    }: {
      docId: number;
      action: DocumentReviewAction;
      reason?: string;
      isVehicle: boolean;
    }) =>
      isVehicle
        ? dispatchersApi.reviewVehicleDocument(dispatcherId, docId, action, reason)
        : dispatchersApi.reviewDocument(dispatcherId, docId, action, reason),
    onSuccess: () => {
      toast.success('Document reviewed');
      queryClient.invalidateQueries({ queryKey: ['dispatcher', dispatcherId] });
    },
    onError: () => toast.error('Review failed'),
  });

  const dispatcher = data?.data;

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-40 bg-slate-200 rounded" />
        <div className="card p-6 h-40 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (!dispatcher) {
    return (
      <div className="text-center py-16 text-slate-500">
        Dispatcher not found.
        <button onClick={() => navigate(-1)} className="ml-2 text-brand-500 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const isOnline = dispatcher.status?.toLowerCase() === 'online' || dispatcher.user?.is_online;
  const lastSeen = new Date(dispatcher.user?.updated_at || dispatcher.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const statusText = isOnline ? 'Online' : `Offline (Seen: ${lastSeen})`;

  return (
    <div className="space-y-5 animate-fade-in w-full">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dispatchers
      </button>

      {/* Profile header card */}
      <div className="card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {dispatcher.image_url ? (
              <img
                src={dispatcher.image_url}
                alt={dispatcher.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center border-2 border-brand-200">
                <span className="text-2xl font-bold text-brand-600">
                  {dispatcher.name.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-slate-800">{dispatcher.name}</h2>
              <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
                <Phone className="w-3.5 h-3.5" />
                {dispatcher.phone_number}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-sm text-slate-500">
                <MapPin className="w-3.5 h-3.5" />
                {dispatcher.city}, {dispatcher.state}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 items-end">
            <div className="flex items-center gap-2">
              <Badge
                label={statusText}
                variant={isOnline ? 'emerald' : 'slate'}
                dot
              />
            </div>
            <div className="flex gap-2 mt-2">
              {!dispatcher.is_approved ? (
                <button
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending}
                  className="btn-success text-xs px-3 py-1.5"
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5" />
                  )}
                  Approve
                </button>
              ) : (
                <button
                  onClick={() => setSuspendModal(true)}
                  className="btn-danger text-xs px-3 py-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Suspend
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100">
          <InfoItem icon={Car} label="Vehicle" value={`${dispatcher.vehicle_make} ${dispatcher.vehicle_model} (${dispatcher.vehicle_year})`} />
          <InfoItem icon={Car} label="Color / Plate" value={`${dispatcher.vehicle_color} · ${dispatcher.license_plate}`} />
          <InfoItem icon={Package} label="Total Deliveries" value={String(dispatcher.deliveries_count ?? '—')} />
          <InfoItem icon={MapPin} label="Service Radius" value={`${dispatcher.preferred_radius_km} km`} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px',
              activeTab === tab
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Profile' && (
        <div className="card p-5 space-y-3">
          <p className="section-title">Account</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-slate-400">Email</span>
              <p className="font-medium text-slate-700 mt-0.5">{dispatcher.user?.email ?? 'N/A'}</p>
            </div>
            <div>
              <span className="text-slate-400">Joined</span>
              <p className="font-medium text-slate-700 mt-0.5">
                {new Date(dispatcher.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Onboarding</span>
              <p className="font-medium text-slate-700 mt-0.5 capitalize">
                {dispatcher.onboarding_status.replace('_', ' ')}
              </p>
            </div>
            {dispatcher.approved_at && (
              <div>
                <span className="text-slate-400">Approved At</span>
                <p className="font-medium text-slate-700 mt-0.5">
                  {new Date(dispatcher.approved_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
          {dispatcher.metadata?.suspension_reason && (
            <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100">
              <p className="text-xs font-semibold text-red-600 mb-1">Suspension Reason</p>
              <p className="text-sm text-red-700">{dispatcher.metadata.suspension_reason}</p>
            </div>
          )}
        </div>
      )}

      {(activeTab === 'Documents' || activeTab === 'Vehicle Docs') && (
        <div className="space-y-3">
          {(activeTab === 'Documents' ? dispatcher.documents : dispatcher.vehicle_documents).length === 0 ? (
            <div className="card p-8 text-center text-sm text-slate-400">No documents uploaded</div>
          ) : (
            (activeTab === 'Documents' ? dispatcher.documents : dispatcher.vehicle_documents).map((doc) => (
              <div key={doc.id} className="card p-4 flex items-start gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-700 capitalize">
                      {doc.document_type.replace(/_/g, ' ')}
                    </p>
                    <Badge
                      label={doc.status}
                      variant={
                        doc.status === 'approved' ? 'green' : doc.status === 'rejected' ? 'red' : 'yellow'
                      }
                    />
                  </div>
                  {doc.rejection_reason && (
                    <p className="text-xs text-red-500 mt-1">{doc.rejection_reason}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5">
                    Uploaded {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-xs py-1.5 px-2.5"
                  >
                    View
                  </a>
                  {doc.status === 'pending' && (
                    <>
                      <button
                        onClick={() =>
                          docMutation.mutate({ docId: doc.id, action: 'approved', isVehicle: activeTab === 'Vehicle Docs' })
                        }
                        disabled={docMutation.isPending}
                        className="btn-success text-xs py-1.5 px-2.5"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Rejection reason:');
                          if (reason) {
                            docMutation.mutate({ docId: doc.id, action: 'rejected', reason, isVehicle: activeTab === 'Vehicle Docs' });
                          }
                        }}
                        disabled={docMutation.isPending}
                        className="btn-danger text-xs py-1.5 px-2.5"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'Deliveries' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Tracking</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Pickup</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {!delivData ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">Loading...</td></tr>
              ) : delivData.data.data.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">No deliveries found</td></tr>
              ) : (
                delivData.data.data.map((d) => (
                  <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{d.tracking_code}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[180px] truncate">{d.pickup_address}</td>
                    <td className="px-4 py-3">
                      <Badge label={d.status} variant={d.status === 'delivered' ? 'green' : d.status === 'cancelled' ? 'red' : 'yellow'} />
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-700">
                      ₦{d.total_amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(d.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {delivData?.data && (
            <div className="px-4 divider">
              <Pagination
                currentPage={delivData.data.current_page}
                lastPage={delivData.data.last_page}
                total={delivData.data.total}
                from={delivData.data.from}
                to={delivData.data.to}
                onPageChange={setDelivPage}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'Wallet' && (
        <div className="space-y-4">
          {/* Wallet balance */}
          <div className="card p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Balance</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">
                ₦{parseFloat(walletData?.data?.balance ?? '0').toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Bonus: ₦{parseFloat(walletData?.data?.bonus_balance ?? '0').toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setWalletModal('credit')} className="btn-success text-xs gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Credit
              </button>
              <button onClick={() => setWalletModal('debit')} className="btn-danger text-xs gap-1.5">
                <Minus className="w-3.5 h-3.5" /> Debit
              </button>
            </div>
          </div>

          {/* Transactions */}
          <div className="card overflow-x-auto">
            <div className="px-5 py-3 border-b border-slate-100">
              <p className="section-title">Transactions</p>
            </div>
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {!walletData?.data?.transactions?.data ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm">Loading...</td></tr>
                ) : walletData.data.transactions.data.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm">No transactions</td></tr>
                ) : (
                  walletData.data.transactions.data.map((tx) => (
                    <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Badge
                          label={tx.transaction_type}
                          variant={tx.transaction_type === 'credit' ? 'green' : 'red'}
                        />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{tx.description}</td>
                      <td className={clsx('px-4 py-3 text-sm font-semibold', tx.transaction_type === 'credit' ? 'text-emerald-600' : 'text-red-500')}>
                        {tx.transaction_type === 'credit' ? '+' : '-'}₦{parseFloat(tx.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {walletData?.data?.transactions && (
              <div className="px-4 divider">
                <Pagination
                  currentPage={walletData.data.transactions.current_page}
                  lastPage={walletData.data.transactions.last_page}
                  total={walletData.data.transactions.total}
                  from={walletData.data.transactions.from}
                  to={walletData.data.transactions.to}
                  onPageChange={setWalletPage}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      <Modal
        open={suspendModal}
        onClose={() => setSuspendModal(false)}
        title="Suspend Dispatcher"
        footer={
          <>
            <button onClick={() => setSuspendModal(false)} className="btn-secondary text-sm">
              Cancel
            </button>
            <button
              onClick={() => suspendMutation.mutate(suspendReason)}
              disabled={suspendMutation.isPending}
              className="btn-danger text-sm"
            >
              {suspendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Suspend
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600 mb-3">
          Are you sure you want to suspend <strong>{dispatcher.name}</strong>?
        </p>
        <label className="label">Reason (optional)</label>
        <textarea
          value={suspendReason}
          onChange={(e) => setSuspendReason(e.target.value)}
          className="input h-24 resize-none"
          placeholder="e.g. Repeated policy violations"
        />
      </Modal>

      {/* Wallet Modal */}
      <Modal
        open={!!walletModal}
        onClose={() => setWalletModal(null)}
        title={walletModal === 'credit' ? 'Credit Wallet' : 'Debit Wallet'}
        footer={
          <>
            <button onClick={() => setWalletModal(null)} className="btn-secondary text-sm">
              Cancel
            </button>
            <button
              onClick={() =>
                walletMutation.mutate({
                  type: walletModal!,
                  amount: parseFloat(walletAmount),
                  desc: walletDesc,
                })
              }
              disabled={walletMutation.isPending || !walletAmount}
              className={walletModal === 'credit' ? 'btn-success text-sm' : 'btn-danger text-sm'}
            >
              {walletMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {walletModal === 'credit' ? 'Credit' : 'Debit'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="label">Amount (₦)</label>
            <input
              type="number"
              min="1"
              value={walletAmount}
              onChange={(e) => setWalletAmount(e.target.value)}
              className="input"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="label">Description</label>
            <input
              type="text"
              value={walletDesc}
              onChange={(e) => setWalletDesc(e.target.value)}
              className="input"
              placeholder="e.g. Bonus payout for April"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.FC<{ className?: string }>; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-slate-400 mb-1">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}
