import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  Utensils,
  Tag,
  Clock,
  Sparkles,
  Building2,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Cooked Meals',
  'Bakery & Bread',
  'Fresh Produce',
  'Dairy Products',
  'Packaged Goods',
  'Beverages',
  'Other'
];

export default function BrowseDonations({ onOpenAuth }) {
  const { user, isAuthenticated } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('available');

  // Request Modal State
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [requestQty, setRequestQty] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState('');
  const [requestError, setRequestError] = useState('');

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category !== 'All') params.category = category;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.getDonations(params);
      setDonations(res.donations || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch donations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [category, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDonations();
  };

  const handleOpenRequest = (donation) => {
    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }
    if (user.role !== 'ngo' && user.role !== 'admin') {
      alert(`Only verified NGOs or Shelters can request donations. You are logged in as a ${user.role}. Use the Demo Switcher to switch to an NGO.`);
      return;
    }
    setSelectedDonation(donation);
    setRequestQty(donation.quantityKg);
    setRequestSuccess('');
    setRequestError('');
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setRequestLoading(true);
    setRequestError('');
    try {
      const res = await api.createRequest({
        donationId: selectedDonation.id || selectedDonation._id,
        requestedQuantityKg: parseFloat(requestQty)
      });
      setRequestSuccess('Donation successfully requested! Donor will review and dispatch courier.');
      // Refresh list
      fetchDonations();
      setTimeout(() => {
        setSelectedDonation(null);
      }, 2000);
    } catch (err) {
      setRequestError(err.message || 'Failed to submit request');
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-warm-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-warm-900 tracking-tight">Available Food Listings</h1>
          <p className="text-xs text-warm-500 mt-1">
            Browse surplus food posted by donors. Claim portions for community distribution.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-warm-500">Status:</span>
          {['available', 'all'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition ${
                statusFilter === st
                  ? 'bg-brand-600 text-white'
                  : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-warm-200 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-warm-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by food title, description, or pickup address..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-warm-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
          >
            Search
          </button>
        </form>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition font-medium ${
                category === cat
                  ? 'bg-warm-900 text-white font-bold'
                  : 'bg-warm-100 hover:bg-warm-200 text-warm-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-warm-500 font-medium">Querying MongoDB for available donations...</p>
        </div>
      ) : donations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-warm-200 p-8">
          <Utensils className="w-10 h-10 text-warm-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-warm-800">No Donations Found</h3>
          <p className="text-xs text-warm-500 max-w-sm mx-auto mt-1">
            There are currently no listings matching your selected category and search criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {donations.map((d) => {
            const isAvailable = d.status === 'available';
            const availableDate = d.availableUntil ? new Date(d.availableUntil) : null;
            const isExpired = availableDate && availableDate < new Date();

            return (
              <div
                key={d.id || d._id}
                className="bg-white rounded-2xl border border-warm-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                      {d.category}
                    </span>
                    <StatusBadge status={d.status} />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-warm-900 leading-snug">{d.foodName}</h3>
                    {d.donorName && (
                      <p className="text-xs text-warm-500 mt-0.5 font-medium">
                        Donated by <span className="text-warm-700">{d.donorName}</span>
                      </p>
                    )}
                  </div>

                  {d.description && (
                    <p className="text-xs text-warm-600 line-clamp-2 leading-relaxed">
                      {d.description}
                    </p>
                  )}

                  {/* Dietary Info Tags */}
                  {d.dietaryInfo && d.dietaryInfo.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {d.dietaryInfo.map((tag, idx) => (
                        <span key={idx} className="text-[10px] bg-warm-100 text-warm-700 px-2 py-0.5 rounded font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Key Info Details */}
                  <div className="space-y-1.5 pt-2 border-t border-warm-100 text-xs text-warm-600">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span>
                        Available until:{' '}
                        <span className="font-semibold text-warm-800">
                          {availableDate ? availableDate.toLocaleString() : 'N/A'}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-warm-400 flex-shrink-0" />
                      <span className="truncate">{d.pickupAddress}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Section */}
                <div className="mt-5 pt-4 border-t border-warm-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-semibold text-warm-400 uppercase">Quantity</div>
                    <div className="text-base font-extrabold text-warm-900">{d.quantityKg} kg</div>
                  </div>

                  {isAvailable && !isExpired ? (
                    <button
                      onClick={() => handleOpenRequest(d)}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Request Food</span>
                    </button>
                  ) : (
                    <span className="text-xs text-warm-400 italic">
                      {isExpired ? 'Listing Expired' : 'Claimed / Assigned'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Request Modal */}
      {selectedDonation && (
        <div className="fixed inset-0 z-50 bg-warm-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-warm-200 p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-warm-900">Request Donation Portions</h3>
                <p className="text-xs text-warm-500">{selectedDonation.foodName}</p>
              </div>
              <button
                onClick={() => setSelectedDonation(null)}
                className="text-warm-400 hover:text-warm-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {requestSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>{requestSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                {requestError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    {requestError}
                  </div>
                )}

                <div className="bg-warm-50 p-3 rounded-xl border border-warm-200 text-xs space-y-1.5 text-warm-700">
                  <div className="flex justify-between">
                    <span>Available Quantity:</span>
                    <span className="font-bold">{selectedDonation.quantityKg} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pickup Address:</span>
                    <span className="truncate max-w-[200px] font-medium">{selectedDonation.pickupAddress}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-warm-700 mb-1">
                    Requested Quantity (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max={selectedDonation.quantityKg}
                    required
                    value={requestQty}
                    onChange={(e) => setRequestQty(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-warm-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-warm-400 mt-1">
                    Enter the amount of food your organization can transport and distribute.
                  </p>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDonation(null)}
                    className="px-4 py-2 border border-warm-300 text-warm-700 hover:bg-warm-100 text-xs font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={requestLoading}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
                  >
                    {requestLoading ? 'Submitting...' : 'Confirm Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
