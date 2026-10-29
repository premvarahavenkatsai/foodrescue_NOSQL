import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import {
  Building2,
  PackageCheck,
  Truck,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar
} from 'lucide-react';

export default function NgoDashboard({ setCurrentView }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmingId, setConfirmingId] = useState(null);
  const [receiptSuccess, setReceiptSuccess] = useState('');

  const fetchMyRequests = async () => {
    setLoading(true);
    try {
      const res = await api.getMyRequests();
      setRequests(res.requests || []);
    } catch (err) {
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const handleConfirmReceipt = async (taskId) => {
    if (!window.confirm("Confirm that food has arrived in good, safe condition? This will officially verify the rescue and grant points to the volunteer.")) return;

    setConfirmingId(taskId);
    setReceiptSuccess('');
    try {
      const res = await api.confirmReceipt(taskId);
      setReceiptSuccess(`Verified! Points awarded: +${res.details.pointsAwarded} to courier.`);
      fetchMyRequests();
    } catch (err) {
      alert(err.message || 'Failed to confirm receipt');
    } finally {
      setConfirmingId(null);
    }
  };

  const totalFoodRequested = requests.reduce((acc, r) => acc + (r.requestedQuantityKg || 0), 0);
  const fulfilledCount = requests.filter(r => r.status === 'fulfilled').length;
  const inProgressCount = requests.filter(r => ['pending', 'approved'].includes(r.status)).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-warm-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-warm-900 tracking-tight">NGO & Shelter Portal</h1>
          <p className="text-xs text-warm-500 mt-1">
            Track requested food portions, incoming volunteer couriers, and verify receipt of safe meals.
          </p>
        </div>
        <button
          onClick={() => setCurrentView('browse')}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-brand-600/30 transition flex items-center space-x-2"
        >
          <Building2 className="w-4 h-4" />
          <span>Browse Available Donations</span>
        </button>
      </div>

      {receiptSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{receiptSuccess}</span>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-warm-200 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center mb-2">
            <PackageCheck className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-warm-900">{totalFoodRequested.toFixed(1)} kg</div>
          <div className="text-xs text-warm-500 font-medium mt-0.5">Total Food Requested</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-warm-200 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-warm-900">{fulfilledCount}</div>
          <div className="text-xs text-warm-500 font-medium mt-0.5">Fulfilled Deliveries</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-warm-200 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
            <Truck className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-warm-900">{inProgressCount}</div>
          <div className="text-xs text-warm-500 font-medium mt-0.5">Active In-Progress Requests</div>
        </div>
      </div>

      {/* Requests & Inbound Deliveries List */}
      <div className="bg-white rounded-2xl border border-warm-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-warm-200 flex justify-between items-center">
          <h2 className="text-sm font-bold text-warm-900">Your Incoming Requests & Deliveries</h2>
          <span className="text-xs text-warm-500 font-medium">{requests.length} records</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-warm-500">Loading incoming requests...</div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center p-6 space-y-3">
            <Building2 className="w-10 h-10 text-warm-300 mx-auto" />
            <h3 className="text-sm font-bold text-warm-800">No Food Requests Yet</h3>
            <p className="text-xs text-warm-500 max-w-sm mx-auto">
              Browse currently listed surplus batches from donors and submit a delivery request.
            </p>
            <button
              onClick={() => setCurrentView('browse')}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
            >
              Browse Food Donations
            </button>
          </div>
        ) : (
          <div className="divide-y divide-warm-100">
            {requests.map((r) => {
              const donation = r.donation || {};
              const task = r.deliveryTask;
              const canConfirm = task && ['picked_up', 'accepted'].includes(task.status) && !task.pointsAwarded;
              const isFulfilled = r.status === 'fulfilled';

              return (
                <div key={r.id || r._id} className="p-5 hover:bg-warm-50/50 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1.5 max-w-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-warm-900">{donation.foodName || 'Food Item'}</span>
                      <StatusBadge status={r.status} />
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-warm-500">
                      <span>Category: <strong className="text-warm-700">{donation.category}</strong></span>
                      <span>Requested: <strong className="text-warm-900">{r.requestedQuantityKg} kg</strong></span>
                    </div>

                    {donation.pickupAddress && (
                      <div className="flex items-center space-x-1.5 text-xs text-warm-500">
                        <MapPin className="w-3.5 h-3.5 text-warm-400" />
                        <span>Pickup: {donation.pickupAddress}</span>
                      </div>
                    )}

                    {task && (
                      <div className="text-[11px] font-mono text-brand-700 bg-brand-50 inline-block px-2 py-0.5 rounded border border-brand-200">
                        Delivery State: {task.status.replace('_', ' ').toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 self-end md:self-center">
                    {canConfirm && (
                      <button
                        onClick={() => handleConfirmReceipt(task.id || task._id)}
                        disabled={confirmingId === (task.id || task._id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/30 transition flex items-center space-x-1.5 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{confirmingId === (task.id || task._id) ? 'Verifying...' : 'Confirm Delivery Receipt'}</span>
                      </button>
                    )}

                    {isFulfilled && (
                      <div className="flex items-center space-x-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Receipt Verified</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
