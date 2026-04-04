export type BadgeVariant =
  | 'green'
  | 'red'
  | 'yellow'
  | 'blue'
  | 'slate'
  | 'orange'
  | 'emerald'
  | 'purple';

// Helper: map delivery status -> badge variant
export function deliveryStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    pending:    { label: 'Pending',    variant: 'yellow' },
    assigned:   { label: 'Assigned',   variant: 'blue'   },
    accepted:   { label: 'Accepted',   variant: 'blue'   },
    picked_up:  { label: 'Picked Up',  variant: 'orange' },
    delivering: { label: 'Delivering', variant: 'purple' },
    delivered:  { label: 'Delivered',  variant: 'green'  },
    cancelled:  { label: 'Cancelled',  variant: 'red'    },
  };
  return map[status] ?? { label: status, variant: 'slate' as BadgeVariant };
}

export function paymentStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    paid:    { label: 'Paid',    variant: 'green'  },
    pending: { label: 'Pending', variant: 'yellow' },
    failed:  { label: 'Failed',  variant: 'red'    },
  };
  return map[status] ?? { label: status, variant: 'slate' as BadgeVariant };
}

export function dispatcherStatusBadge(isApproved: boolean, onboardingStatus: string) {
  if (isApproved && onboardingStatus === 'approved') {
    return { label: 'Active', variant: 'green' as BadgeVariant };
  }
  if (!isApproved && onboardingStatus === 'approved') {
    return { label: 'Suspended', variant: 'red' as BadgeVariant };
  }
  return { label: 'Pending', variant: 'yellow' as BadgeVariant };
}
