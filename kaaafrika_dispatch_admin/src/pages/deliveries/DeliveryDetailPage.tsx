import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Package,
  MapPin,
  Phone,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  User,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { deliveriesApi } from '../../api/deliveries';
import { dispatchersApi } from '../../api/dispatchers';
import { Badge } from '../../components/ui/Badge';
import { deliveryStatusBadge, paymentStatusBadge } from '../../components/ui/badgeUtils';
import { Modal } from '../../components/ui/Modal';
import type { PayoutStatus } from '../../types';
import { clsx } from 'clsx';

const STATUS_STEPS = ['pending', 'assigned', 'accepted', 'picked_up', 'delivering', 'delivered'];

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);
}

export function DeliveryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const deliveryId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [reassignModal, setReassignModal] = useState(false);
  const [reassignDispatcher, setReassignDispatcher] = useState('');
  const [reassignSearch, setReassignSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['delivery', deliveryId],
    queryFn: () => deliveriesApi.getOne(deliveryId),
  });

  const otpRequired = data?.data?.otp_required ?? false;
  const { data: otpData } = useQuery({
    queryKey: ['delivery-otp', deliveryId],
    queryFn: () => deliveriesApi.getOtp(deliveryId),
    enabled: otpRequired,
    retry: false,
  });

  const { data: dispatchersData } = useQuery({
    queryKey: ['dispatchers-search', reassignSearch],
    queryFn: () => dispatchersApi.list({ search: reassignSearch, is_approved: '1', per_page: 20 }),
    enabled: reassignModal,
    staleTime: 1000 * 30,
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => deliveriesApi.cancel(deliveryId, reason),
    onSuccess: () => {
      toast.success('Delivery cancelled');
      setCancelModal(false);
      queryClient.invalidateQueries({ queryKey: ['delivery', deliveryId] });
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    },
    onError: () => toast.error('Failed to cancel delivery'),
  });

  const confirmMutation = useMutation({
    mutationFn: () => deliveriesApi.confirm(deliveryId),
    onSuccess: () => {
      toast.success('Delivery confirmed');
      queryClient.invalidateQueries({ queryKey: ['delivery', deliveryId] });
    },
    onError: () => toast.error('Failed to confirm delivery'),
  });

  const reassignMutation = useMutation({
    mutationFn: (dispatcherId: number) => deliveriesApi.reassign(deliveryId, dispatcherId),
    onSuccess: () => {
      toast.success('Delivery reassigned');
      setReassignModal(false);
      queryClient.invalidateQueries({ queryKey: ['delivery', deliveryId] });
    },
    onError: () => toast.error('Failed to reassign'),
  });

  const payoutMutation = useMutation({
    mutationFn: (status: PayoutStatus) => deliveriesApi.updatePayoutStatus(deliveryId, status),
    onSuccess: () => {
      toast.success('Payout status updated');
      queryClient.invalidateQueries({ queryKey: ['delivery', deliveryId] });
    },
    onError: () => toast.error('Failed to update payout status'),
  });

  const delivery = data?.data;

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-40 bg-slate-200 rounded" />
        <div className="card p-6 h-48 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="text-center py-16 text-slate-500">
        Delivery not found.
        <button onClick={() => navigate(-1)} className="ml-2 text-brand-500 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const statusBadge = deliveryStatusBadge(delivery.status);
  const payBadge = paymentStatusBadge(delivery.payment_status);
  const currentStepIdx = Math.max(STATUS_STEPS.indexOf(delivery.status), 0);
  const paymentMethod =
    typeof delivery.payment_method === 'string' && delivery.payment_method.length > 0
      ? delivery.payment_method.toUpperCase()
      : '—';

  const isCancellable = !['delivered', 'cancelled'].includes(delivery.status);
  const isConfirmable = delivery.status === 'delivering' || delivery.status === 'picked_up';

  return (
    <div className="space-y-5 animate-fade-in w-full">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Deliveries
      </button>

      {/* Header card */}
      <div className="card p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-slate-400" />
              <code className="text-sm font-bold text-slate-700 tracking-wide">{delivery.tracking_code}</code>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge label={statusBadge.label} variant={statusBadge.variant} dot />
              <Badge label={payBadge.label} variant={payBadge.variant} />
              {delivery.otp_required && <Badge label="OTP Required" variant="blue" />}
            </div>
          </div>

          {/* Admin actions */}
          <div className="flex flex-wrap gap-2">
            {isConfirmable && (
              <button
                onClick={() => confirmMutation.mutate()}
                disabled={confirmMutation.isPending}
                className="btn-success text-xs"
              >
                {confirmMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                Confirm Delivery
              </button>
            )}
            <button
              onClick={() => setReassignModal(true)}
              className="btn-secondary text-xs gap-1.5"
              disabled={delivery.status === 'delivered' || delivery.status === 'cancelled'}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reassign
            </button>
            {isCancellable && (
              <button onClick={() => setCancelModal(true)} className="btn-danger text-xs">
                <XCircle className="w-3.5 h-3.5" />
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {delivery.status !== 'cancelled' && (
          <div className="mt-5">
            <div className="flex items-center">
              {STATUS_STEPS.map((step, idx) => (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div
                    className={clsx(
                      'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 flex-shrink-0 transition-colors',
                      idx < currentStepIdx
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : idx === currentStepIdx
                        ? 'bg-brand-500 border-brand-500 text-white'
                        : 'bg-white border-slate-200 text-slate-400'
                    )}
                  >
                    {idx < currentStepIdx ? '✓' : idx + 1}
                  </div>
                  {idx < STATUS_STEPS.length - 1 && (
                    <div
                      className={clsx(
                        'flex-1 h-0.5 mx-1',
                        idx < currentStepIdx ? 'bg-emerald-400' : 'bg-slate-200'
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1">
              {STATUS_STEPS.map((step) => (
                <span key={step} className="text-[9px] text-slate-400 capitalize">
                  {step.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pickup & dropoff */}
        <div className="card p-5 space-y-4">
          <p className="section-title">Route</p>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-brand-500" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Pickup</p>
                <p className="text-sm font-medium text-slate-700">{delivery.pickup_address}</p>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-400">
                  <User className="w-3 h-3" />
                  {delivery.pickup_contact_name}
                  <Phone className="w-3 h-3 ml-1" />
                  {delivery.pickup_contact_phone}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Dropoff</p>
                <p className="text-sm font-medium text-slate-700">{delivery.dropoff_address}</p>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-400">
                  <User className="w-3 h-3" />
                  {delivery.dropoff_contact_name}
                  <Phone className="w-3 h-3 ml-1" />
                  {delivery.dropoff_contact_phone}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Package & financials */}
        <div className="card p-5 space-y-4">
          <p className="section-title">Package & Financials</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <DetailItem label="Base Fare" value={formatCurrency(delivery.base_fare)} />
            <DetailItem label="Total Amount" value={formatCurrency(delivery.total_amount)} highlight />
            <DetailItem label="Payout" value={formatCurrency(delivery.payout_amount)} />
            <DetailItem label="Payment Method" value={paymentMethod} />
          </div>

          {/* Payout status */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Payout Status</p>
                <Badge
                  label={delivery.payout_status}
                  variant={
                    delivery.payout_status === 'paid' ? 'green' : delivery.payout_status === 'failed' ? 'red' : 'yellow'
                  }
                  className="mt-1"
                />
              </div>
              {delivery.payout_status !== 'paid' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => payoutMutation.mutate('paid')}
                    disabled={payoutMutation.isPending}
                    className="btn-success text-xs py-1 px-2.5"
                  >
                    Mark Paid
                  </button>
                  {delivery.payout_status !== 'failed' && (
                    <button
                      onClick={() => payoutMutation.mutate('failed')}
                      disabled={payoutMutation.isPending}
                      className="btn-danger text-xs py-1 px-2.5"
                    >
                      Mark Failed
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {delivery.otp_required && (
            <div className="pt-3 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Delivery OTP</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm font-semibold text-slate-700">
                  {otpData?.data?.code ?? 'Not available'}
                </p>
                {otpData?.data ? (
                  otpData.data.is_used ? (
                    <Badge label="Used" variant="slate" />
                  ) : (
                    <Badge label="Active" variant="green" />
                  )
                ) : (
                  <Badge label="Unavailable" variant="slate" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: dispatcher + timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dispatcher */}
        <div className="card p-5">
          <p className="section-title mb-3">Dispatcher</p>
          {delivery.dispatcher ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                <Truck className="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{delivery.dispatcher.name}</p>
                <p className="text-xs text-slate-400">{(delivery.dispatcher as { phone_number?: string }).phone_number ?? '—'}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Not yet assigned</p>
          )}
        </div>

        {/* Tracking timeline */}
        <div className="card p-5">
          <p className="section-title mb-3">Timeline</p>
          {delivery.tracking_steps && delivery.tracking_steps.length > 0 ? (
            <div className="space-y-3">
              {delivery.tracking_steps.map((step, i) => (
                <div key={step.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={clsx('w-5 h-5 rounded-full flex-shrink-0', i === 0 ? 'bg-brand-500' : 'bg-slate-200')} />
                    {i < delivery.tracking_steps.length - 1 && (
                      <div className="w-0.5 h-full bg-slate-100 my-1" />
                    )}
                  </div>
                  <div className="pb-3">
                    <p className="text-xs font-semibold text-slate-700 capitalize">
                      {(step.step ?? '').replace('_', ' ')}
                    </p>
                    <p className="text-[11px] text-slate-400">{step.description}</p>
                    <p className="text-[10px] text-slate-300 mt-0.5">
                      {new Date(step.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="w-4 h-4" />
              <p className="text-sm">No tracking steps yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      <Modal
        open={cancelModal}
        onClose={() => setCancelModal(false)}
        title="Cancel Delivery"
        footer={
          <>
            <button onClick={() => setCancelModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button
              onClick={() => cancelMutation.mutate(cancelReason)}
              disabled={cancelMutation.isPending || !cancelReason}
              className="btn-danger text-sm"
            >
              {cancelMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Confirm Cancel
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600 mb-3">Please provide a reason for cancelling this delivery.</p>
        <label className="label">Reason</label>
        <textarea
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          className="input h-24 resize-none"
          placeholder="e.g. Customer request"
        />
      </Modal>

      {/* Reassign Modal */}
      <Modal
        open={reassignModal}
        onClose={() => setReassignModal(false)}
        title="Reassign Delivery"
        size="lg"
        footer={
          <>
            <button onClick={() => setReassignModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button
              onClick={() => reassignMutation.mutate(Number(reassignDispatcher))}
              disabled={reassignMutation.isPending || !reassignDispatcher}
              className="btn-primary text-sm"
            >
              {reassignMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Reassign
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="label">Search Dispatcher</label>
            <input
              type="text"
              className="input"
              placeholder="Search by name or phone..."
              value={reassignSearch}
              onChange={(e) => setReassignSearch(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {dispatchersData?.data?.data?.map((d) => (
              <button
                key={d.id}
                onClick={() => setReassignDispatcher(String(d.id))}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm border transition-all',
                  reassignDispatcher === String(d.id)
                    ? 'bg-brand-50 border-brand-500 text-brand-700'
                    : 'bg-white border-slate-100 hover:border-slate-200 text-slate-700'
                )}
              >
                <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-[10px] font-bold text-brand-600">
                  {d.name.charAt(0)}
                </div>
                <div className="text-left">
                  <p className="font-medium text-xs">{d.name}</p>
                  <p className="text-[10px] text-slate-400">{d.phone_number} Â· {d.status}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

function DetailItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] text-slate-400 font-semibold uppercase">{label}</p>
      <p className={clsx('mt-0.5 font-semibold', highlight ? 'text-slate-800 text-base' : 'text-slate-700 text-sm')}>
        {value}
      </p>
    </div>
  );
}
