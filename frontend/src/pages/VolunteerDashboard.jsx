import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import {
  Truck,
  Award,
  CheckCircle2,
  Package,
  MapPin,
  Clock,
  ArrowRight,
  Sparkles,
  FileText,
  AlertCircle
} from 'lucide-react';

export default function VolunteerDashboard({ setCurrentView }) {
  const [availableTasks, setAvailableTasks] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [volunteerProfile, setVolunteerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [availRes, myRes, profileRes] = await Promise.all([
        api.getAvailableTasks(),
        api.getMyTasks(),
        api.getProfile()
      ]);
      setAvailableTasks(availRes.tasks || []);
      setMyTasks(myRes.tasks || []);
      setVolunteerProfile(profileRes.user?.volunteerProfile || null);
    } catch (err) {
      setError(err.message || 'Failed to load volunteer data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAcceptTask = async (taskId) => {
    setActionLoading(true);
    setMessage('');
    setError('');
    try {
      await api.acceptTask(taskId);
      setMessage('Task accepted successfully! You are now assigned to collect this food.');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to accept task');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePickupTask = async (taskId) => {
    setActionLoading(true);
    setMessage('');
    setError('');
    try {
      await api.pickupTask(taskId);
      setMessage('Marked as picked up! Please proceed to the shelter destination.');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to update pickup status');
    } finally {
      setActionLoading(false);
    }
  };

  const totalPoints = volunteerProfile?.totalPoints || 0;
  const totalDeliveries = volunteerProfile?.totalDeliveries || 0;
  const totalFoodKg = volunteerProfile?.totalFoodDeliveredKg || 0;
  const badges = volunteerProfile?.badges || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-warm-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-warm-900 tracking-tight">Volunteer Courier Portal</h1>
          <p className="text-xs text-warm-500 mt-1">
            Accept rescue deliveries, record safe handoffs, and earn verified community badges.
          </p>
        </div>

        {totalDeliveries > 0 ? (
          <button
            onClick={() => setCurrentView('certificate')}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-brand-600/30 transition flex items-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>Generate Official Certificate</span>
          </button>
        ) : (
          <div className="text-xs text-warm-500 font-medium bg-warm-100 px-3 py-1.5 rounded-lg border border-warm-200">
            Complete 1 delivery to unlock Certificate
          </div>
        )}
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Volunteer Stats & Achievements Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-warm-200 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
            <Award className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-warm-900">{totalPoints}</div>
          <div className="text-xs text-warm-500 font-medium mt-0.5">Earned Points</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-warm-200 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
            <Package className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-warm-900">{totalFoodKg.toFixed(1)} kg</div>
          <div className="text-xs text-warm-500 font-medium mt-0.5">Verified Food Transported</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-warm-200 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-2">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-warm-900">{totalDeliveries}</div>
          <div className="text-xs text-warm-500 font-medium mt-0.5">Completed Rescues</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-warm-200 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-2">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-warm-900">{badges.length}</div>
          <div className="text-xs text-warm-500 font-medium mt-0.5">Unlocked Badges</div>
        </div>
      </div>

      {/* Badges Display */}
      {badges.length > 0 && (
        <div className="bg-gradient-to-r from-brand-50 to-warm-100 p-4 rounded-2xl border border-brand-200/60 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-brand-800 uppercase tracking-wider mr-2">Your Badges:</span>
          {badges.map((b, i) => (
            <span key={i} className="px-3 py-1 bg-white border border-brand-300 text-brand-800 rounded-full text-xs font-bold shadow-xs flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{b}</span>
            </span>
          ))}
        </div>
      )}

      {/* Section 1: Open Tasks Board */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-warm-900">Available Rescue Tasks</h2>
            <p className="text-xs text-warm-500">Pick up surplus food from donors and transport to destination shelters.</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-warm-100 text-warm-700 rounded-lg">
            {availableTasks.length} open
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-warm-500">Searching for rescue tasks...</div>
        ) : availableTasks.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-warm-200 text-center space-y-2">
            <Truck className="w-8 h-8 text-warm-300 mx-auto" />
            <h3 className="text-sm font-bold text-warm-800">No Open Tasks Right Now</h3>
            <p className="text-xs text-warm-500">Check back shortly when donors and NGOs submit new requests.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableTasks.map((t) => (
              <div key={t.id || t._id} className="bg-white rounded-2xl border border-warm-200 p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                        {t.category || 'Food'}
                      </span>
                      <h3 className="text-sm font-bold text-warm-900 mt-1">{t.foodName}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-extrabold text-warm-900">{t.foodQuantityKg} kg</div>
                      <div className="text-[10px] text-warm-400 font-medium">Portion Weight</div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-warm-600 bg-warm-50 p-3 rounded-xl border border-warm-100">
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-brand-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-warm-400 block">Pickup Location</span>
                        <span className="font-medium text-warm-800">{t.pickupAddress}</span>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2 pt-1 border-t border-warm-200/50">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-warm-400 block">Deliver To</span>
                        <span className="font-medium text-warm-800">{t.organizationName} ({t.destinationAddress})</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleAcceptTask(t.id || t._id)}
                  disabled={actionLoading}
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Truck className="w-4 h-4" />
                  <span>Accept Delivery Task</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: My Deliveries */}
      <div className="space-y-4 pt-6 border-t border-warm-200">
        <h2 className="text-base font-bold text-warm-900">Your Assigned Deliveries</h2>

        {myTasks.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-warm-200 text-center text-xs text-warm-500">
            You haven't accepted any tasks yet. Accept a task above to begin.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-warm-200 shadow-sm overflow-hidden divide-y divide-warm-100">
            {myTasks.map((task) => {
              const isAccepted = task.status === 'accepted';
              const isPickedUp = task.status === 'picked_up';
              const isDelivered = task.status === 'delivered';

              return (
                <div key={task.id || task._id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-warm-50/50 transition">
                  <div className="space-y-1.5 max-w-lg">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-warm-900">{task.foodName}</h4>
                      <StatusBadge status={task.status} />
                    </div>

                    <div className="text-xs text-warm-500 space-x-3">
                      <span>Weight: <strong className="text-warm-800">{task.foodQuantityKg} kg</strong></span>
                      <span>To: <strong className="text-warm-800">{task.organizationName}</strong></span>
                    </div>

                    <div className="text-xs text-warm-500 truncate">
                      Pickup: {task.pickupAddress}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end md:self-center">
                    {isAccepted && (
                      <button
                        onClick={() => handlePickupTask(task.id || task._id)}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>Confirm Food Picked Up</span>
                      </button>
                    )}

                    {isPickedUp && (
                      <div className="text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200">
                        En Route to Destination
                      </div>
                    )}

                    {isDelivered && (
                      <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Completed (+Points Awarded)</span>
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
