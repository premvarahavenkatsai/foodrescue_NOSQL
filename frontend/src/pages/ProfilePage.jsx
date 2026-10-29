import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { User, Phone, MapPin, Truck, CheckCircle2, AlertCircle, Save } from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    serviceArea: '',
    availability: 'available',
    transportType: 'car',
    transportCapacityKg: 20
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      const vol = user.volunteerProfile || {};
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        serviceArea: vol.serviceArea || '',
        availability: vol.availability || 'available',
        transportType: vol.transportType || 'car',
        transportCapacityKg: vol.transportCapacityKg || 20
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    try {
      await api.updateProfile({
        name: formData.name,
        phone: formData.phone,
        address: formData.address
      });

      if (user?.role === 'volunteer') {
        await api.updateVolunteerProfile({
          serviceArea: formData.serviceArea,
          availability: formData.availability,
          transportType: formData.transportType,
          transportCapacityKg: parseFloat(formData.transportCapacityKg)
        });
      }

      await refreshUser();
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="border-b border-warm-200 pb-4">
        <h1 className="text-2xl font-bold text-warm-900">User Profile & Settings</h1>
        <p className="text-xs text-warm-500">Update your contact details and role preferences.</p>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-warm-200 p-6 shadow-sm space-y-5">
        <div className="bg-warm-50 p-4 rounded-xl border border-warm-200 flex justify-between items-center text-xs">
          <div>
            <div className="text-[10px] uppercase font-semibold text-warm-400">Account Type</div>
            <div className="text-sm font-bold text-warm-900 capitalize">{user?.role}</div>
            <div className="text-warm-500 text-[11px]">{user?.email}</div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
            Active Account
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-warm-700 mb-1">Full Name</label>
          <input
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-warm-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-warm-700 mb-1">Phone Number</label>
            <input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-warm-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-warm-700 mb-1">Operating Street Address</label>
            <input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-warm-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {user?.role === 'volunteer' && (
          <div className="pt-4 border-t border-warm-100 space-y-4">
            <h3 className="text-xs uppercase font-bold text-brand-700 tracking-wider">
              Volunteer Courier Specifications
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-warm-700 mb-1">Service Area / Zone</label>
                <input
                  value={formData.serviceArea}
                  onChange={(e) => setFormData({ ...formData, serviceArea: e.target.value })}
                  placeholder="e.g. Indiranagar & Koramangala, Bengaluru"
                  className="w-full px-3 py-2 text-xs border border-warm-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-700 mb-1">Availability Status</label>
                <select
                  value={formData.availability}
                  onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-warm-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none capitalize"
                >
                  <option value="available">Available for Tasks</option>
                  <option value="busy">Busy / On Delivery</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-warm-700 mb-1">Transport Mode</label>
                <select
                  value={formData.transportType}
                  onChange={(e) => setFormData({ ...formData, transportType: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-warm-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none capitalize"
                >
                  <option value="walking">Walking</option>
                  <option value="bicycle">Bicycle</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="car">Car</option>
                  <option value="van">Van</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-700 mb-1">Transport Capacity (kg)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.transportCapacityKg}
                  onChange={(e) => setFormData({ ...formData, transportCapacityKg: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-warm-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-warm-100">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-600/30 transition flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
