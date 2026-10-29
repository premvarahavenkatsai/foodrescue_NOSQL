import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import {
  PlusCircle,
  Utensils,
  Clock,
  MapPin,
  TrendingUp,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  X,
  Check,
  Building2
} from 'lucide-react';

const CATEGORIES = [
  'Cooked Meals',
  'Bakery & Bread',
  'Fresh Produce',
  'Dairy Products',
  'Packaged Goods',
  'Beverages',
  'Other'
];

const DIETARY_OPTIONS = [
  'Pure Vegetarian',
  'Jain (No Onion Garlic)',
  'Halal Certified',
  'Contains Dairy',
  'Sattvic',
  'Nut-Free',
  'Organic'
];

export default function DonorDashboard() {
  const [data, setData] = useState({
    donations: [],
    totalDonations: 0,
    totalKgDonated: 0,
    rescuedKg: 0,
    activeCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    foodName: '',
    category: 'Cooked Meals',
    quantityKg: '',
    preparedAt: '',
    availableUntil: '',
    pickupAddress: '',
    dietaryInfo: [],
    description: ''
  });

  const fetchMyDonations = async () => {
    setLoading(true);
    try {
      const res = await api.getMyDonations();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load donations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyDonations();
  }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      foodName: '',
      category: 'Cooked Meals',
      quantityKg: '',
      preparedAt: new Date().toISOString().slice(0, 16),
      availableUntil: new Date(Date.now() + 6 * 3600 * 1000).toISOString().slice(0, 16),
      pickupAddress: '',
      dietaryInfo: [],
      description: ''
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (donation) => {
    setIsEditing(true);
    setEditingId(donation.id || donation._id);
    setFormData({
      foodName: donation.foodName || '',
      category: donation.category || 'Cooked Meals',
      quantityKg: donation.quantityKg || '',
      preparedAt: donation.preparedAt ? new Date(donation.preparedAt).toISOString().slice(0, 16) : '',
      availableUntil: donation.availableUntil ? new Date(donation.availableUntil).toISOString().slice(0, 16) : '',
      pickupAddress: donation.pickupAddress || '',
      dietaryInfo: donation.dietaryInfo || [],
      description: donation.description || ''
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleDietaryToggle = (item) => {
    setFormData(prev => {
      const exists = prev.dietaryInfo.includes(item);
      return {
        ...prev,
        dietaryInfo: exists ? prev.dietaryInfo.filter(x => x !== item) : [...prev.dietaryInfo, item]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const payload = {
        ...formData,
        quantityKg: parseFloat(formData.quantityKg),
        availableUntil: new Date(formData.availableUntil).toISOString(),
        preparedAt: formData.preparedAt ? new Date(formData.preparedAt).toISOString() : new Date().toISOString()
      };

      if (isEditing) {
        await api.updateDonation(editingId, payload);
      } else {
        await api.createDonation(payload);
      }

      setModalOpen(false);
      fetchMyDonations();
    } catch (err) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this donation listing?")) return;
    try {
      await api.cancelDonation(id);
      fetchMyDonations();
    } catch (err) {
      alert(err.message || 'Failed to cancel donation');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-warm-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-warm-900 tracking-tight">Food Donor Portal</h1>
          <p className="text-xs text-warm-500 mt-1">
            Register surplus kitchen portions and coordinate rescues with local shelters.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-brand-600/30 transition flex items-center space-x-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post Food Donation</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-warm-200 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center mb-2">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-warm-900">{data.totalKgDonated} kg</div>
          <div className="text-xs text-warm-500 font-medium mt-0.5">Total Food Donated</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-warm-200 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-warm-900">{data.rescuedKg} kg</div>
          <div className="text-xs text-warm-500 font-medium mt-0.5">Verified Rescued Food</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-warm-200 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-warm-900">{data.activeCount}</div>
          <div className="text-xs text-warm-500 font-medium mt-0.5">Active / Pending Listings</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-warm-200 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-2">
            <Utensils className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-warm-900">{data.totalDonations}</div>
          <div className="text-xs text-warm-500 font-medium mt-0.5">Total Batches Posted</div>
        </div>
      </div>

      {/* Donations List */}
      <div className="bg-white rounded-2xl border border-warm-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-warm-200 flex justify-between items-center">
          <h2 className="text-sm font-bold text-warm-900">Your Donation Listings</h2>
          <span className="text-xs text-warm-500 font-medium">{data.donations.length} records</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-warm-500">Loading donation records...</div>
        ) : data.donations.length === 0 ? (
          <div className="py-16 text-center p-6 space-y-3">
            <Utensils className="w-10 h-10 text-warm-300 mx-auto" />
            <h3 className="text-sm font-bold text-warm-800">No Food Donations Yet</h3>
            <p className="text-xs text-warm-500 max-w-sm mx-auto">
              Start by listing surplus food from your kitchen or bakery.
            </p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
            >
              Create First Listing
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-warm-700">
              <thead className="bg-warm-50 text-[11px] font-semibold text-warm-500 uppercase border-b border-warm-200">
                <tr>
                  <th className="px-5 py-3">Food Name & Category</th>
                  <th className="px-5 py-3">Quantity</th>
                  <th className="px-5 py-3">Collection Deadline</th>
                  <th className="px-5 py-3">Pickup Address</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {data.donations.map((d) => {
                  const canEdit = d.status === 'available';
                  const canCancel = ['available', 'requested'].includes(d.status);
                  const availableUntil = d.availableUntil ? new Date(d.availableUntil) : null;

                  return (
                    <tr key={d.id || d._id} className="hover:bg-warm-50/60 transition">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-warm-900">{d.foodName}</div>
                        <div className="text-[11px] text-brand-700 font-medium">{d.category}</div>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-warm-900">
                        {d.quantityKg} kg
                      </td>
                      <td className="px-5 py-3.5 text-warm-600">
                        {availableUntil ? availableUntil.toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-5 py-3.5 text-warm-600 truncate max-w-[180px]">
                        {d.pickupAddress}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2">
                        {canEdit && (
                          <button
                            onClick={() => openEditModal(d)}
                            className="p-1.5 text-warm-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                            title="Edit Listing"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canCancel && (
                          <button
                            onClick={() => handleCancel(d.id || d._id)}
                            className="p-1.5 text-warm-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Cancel Listing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Donation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-warm-200 p-6 space-y-4 my-8">
            <div className="flex justify-between items-center border-b border-warm-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-warm-900">
                  {isEditing ? 'Edit Donation Listing' : 'Post Surplus Food Donation'}
                </h3>
                <p className="text-xs text-warm-500">Validated with MongoDB $jsonSchema</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-warm-400 hover:text-warm-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-warm-700 mb-1">Food Item Name</label>
                <input
                  required
                  value={formData.foodName}
                  onChange={(e) => setFormData({ ...formData, foodName: e.target.value })}
                  placeholder="e.g. Hyderabadi Veg Biryani & Mirchi Ka Salan"
                  className="w-full px-3 py-2 text-xs border border-warm-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-warm-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-warm-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-warm-700 mb-1">Quantity (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={formData.quantityKg}
                    onChange={(e) => setFormData({ ...formData, quantityKg: e.target.value })}
                    placeholder="e.g. 15.5"
                    className="w-full px-3 py-2 text-xs border border-warm-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-warm-700 mb-1">Prepared Time</label>
                  <input
                    type="datetime-local"
                    value={formData.preparedAt}
                    onChange={(e) => setFormData({ ...formData, preparedAt: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-warm-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-warm-700 mb-1">Available Until</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.availableUntil}
                    onChange={(e) => setFormData({ ...formData, availableUntil: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-warm-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-700 mb-1">Pickup Address</label>
                <input
                  required
                  value={formData.pickupAddress}
                  onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                  placeholder="e.g. 45, MG Road, Indiranagar, Bengaluru"
                  className="w-full px-3 py-2 text-xs border border-warm-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {/* Dietary Tags Checkboxes */}
              <div>
                <label className="block text-xs font-semibold text-warm-700 mb-1">Dietary Information</label>
                <div className="flex flex-wrap gap-1.5">
                  {DIETARY_OPTIONS.map(opt => {
                    const selected = formData.dietaryInfo.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleDietaryToggle(opt)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                          selected
                            ? 'bg-brand-50 border-brand-500 text-brand-700 font-bold'
                            : 'border-warm-200 text-warm-600 hover:bg-warm-50'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-700 mb-1">Description / Packaging Guidance</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Insulated food warmers. Handled according to hygienic standards."
                  className="w-full px-3 py-2 text-xs border border-warm-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-warm-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-warm-300 text-warm-700 hover:bg-warm-100 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {formLoading ? 'Submitting...' : isEditing ? 'Save Changes' : 'Create Donation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
