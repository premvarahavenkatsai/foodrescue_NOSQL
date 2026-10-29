import React from 'react';

const STATUS_STYLES = {
  // Donation / Task Statuses
  available: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  requested: 'bg-amber-100 text-amber-800 border-amber-200',
  pending_assignment: 'bg-orange-100 text-orange-800 border-orange-200',
  assigned: 'bg-blue-100 text-blue-800 border-blue-200',
  accepted: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  picked_up: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-emerald-600 text-white border-emerald-700 shadow-sm',
  fulfilled: 'bg-emerald-600 text-white border-emerald-700 shadow-sm',
  cancelled: 'bg-warm-200 text-warm-700 border-warm-300',
  expired: 'bg-rose-100 text-rose-800 border-rose-200',
  rejected: 'bg-rose-100 text-rose-800 border-rose-200',

  // Verification Statuses
  verified: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  pending: 'bg-amber-100 text-amber-800 border-amber-200',

  // Volunteer Availability
  busy: 'bg-amber-100 text-amber-800 border-amber-200',
  unavailable: 'bg-warm-200 text-warm-600 border-warm-300',
};

const STATUS_LABELS = {
  pending_assignment: 'Awaiting Driver',
  picked_up: 'En Route',
  delivered: 'Rescued & Delivered',
  fulfilled: 'Completed',
  available: 'Available Now',
  requested: 'Requested by NGO',
  assigned: 'Driver Assigned',
  accepted: 'Task Accepted',
};

export default function StatusBadge({ status, className = '' }) {
  const normStatus = (status || '').toLowerCase();
  const style = STATUS_STYLES[normStatus] || 'bg-warm-100 text-warm-800 border-warm-200';
  const label = STATUS_LABELS[normStatus] || status || 'Unknown';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${style} ${className}`}>
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-75"></span>
      {label}
    </span>
  );
}
