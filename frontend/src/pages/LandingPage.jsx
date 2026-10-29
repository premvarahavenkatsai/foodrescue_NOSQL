import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Utensils,
  Building2,
  Truck,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  TrendingUp,
  HeartHandshake,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar
} from 'lucide-react';

export default function LandingPage({ setCurrentView, onOpenAuth }) {
  const { isAuthenticated, user } = useAuth();
  const [kpis, setKpis] = useState({
    totalRescuedKg: 0,
    estimatedMeals: 0,
    completedDeliveries: 0,
    activeDonations: 0,
    volunteersCount: 0,
    verifiedNgosCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.getKpis();
        if (res.kpis) setKpis(res.kpis);
      } catch (e) {
        console.error("Failed to load platform KPIs:", e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-16 py-6 sm:py-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-800 to-warm-900 text-white p-8 sm:p-14 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-400/30 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Intelligent NoSQL Resiliency Engine</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
            Rescuing Surplus Food. <br />
            <span className="text-brand-400">Nourishing Communities.</span>
          </h1>

          <p className="text-base sm:text-lg text-warm-200 font-normal leading-relaxed max-w-2xl">
            A real-time coordination platform connecting commercial dining donors, verified community shelters, and volunteer couriers to eliminate edible food waste with strict food safety verification.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => setCurrentView('browse')}
              className="px-6 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-lg shadow-brand-500/30 transition flex items-center space-x-2"
            >
              <span>Explore Available Food</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {!isAuthenticated ? (
              <button
                onClick={() => setCurrentView('login')}
                className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 backdrop-blur-sm transition"
              >
                Sign In / Join Us
              </button>
            ) : (
              <button
                onClick={() => {
                  if (user?.role === 'donor') setCurrentView('donor-dashboard');
                  else if (user?.role === 'ngo') setCurrentView('ngo-dashboard');
                  else if (user?.role === 'volunteer') setCurrentView('volunteer-dashboard');
                  else if (user?.role === 'admin') setCurrentView('admin-dashboard');
                }}
                className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 backdrop-blur-sm transition flex items-center space-x-2"
              >
                <span>Go to My Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Live Impact Counters (Real MongoDB Aggregation Data) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="text-xs uppercase tracking-widest text-brand-700 font-bold">
            Live Verified Impact
          </h2>
          <p className="text-2xl font-bold text-warm-900 mt-1">
            Aggregated Directly from MongoDB Records
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-6 rounded-2xl border border-warm-200 shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="text-3xl font-extrabold text-warm-900">
              {loading ? '...' : `${kpis.totalRescuedKg} kg`}
            </div>
            <div className="text-xs font-medium text-warm-500 mt-1">Total Rescued Food</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-2">Strictly Verified Delivered</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-warm-200 shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
              <Utensils className="w-5 h-5" />
            </div>
            <div className="text-3xl font-extrabold text-warm-900">
              {loading ? '...' : kpis.estimatedMeals.toLocaleString()}
            </div>
            <div className="text-xs font-medium text-warm-500 mt-1">Meals Provided</div>
            <div className="text-[10px] text-amber-600 font-semibold mt-2">1 kg ≈ 2.5 meals served</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-warm-200 shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-3xl font-extrabold text-warm-900">
              {loading ? '...' : kpis.completedDeliveries}
            </div>
            <div className="text-xs font-medium text-warm-500 mt-1">Completed Deliveries</div>
            <div className="text-[10px] text-blue-600 font-semibold mt-2">Safe Courier Handoffs</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-warm-200 shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="text-3xl font-extrabold text-warm-900">
              {loading ? '...' : `${kpis.verifiedNgosCount} NGOs`}
            </div>
            <div className="text-xs font-medium text-warm-500 mt-1">Verified Shelters</div>
            <div className="text-[10px] text-purple-600 font-semibold mt-2">Admin Audited Partners</div>
          </div>
        </div>
      </section>

      {/* How the 4-Stage Workflow Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-warm-100/70 rounded-3xl p-8 sm:p-12 border border-warm-200">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="text-xs uppercase tracking-widest text-brand-700 font-bold">
              Transparent Operations
            </h3>
            <p className="text-2xl sm:text-3xl font-extrabold text-warm-900 mt-1">
              End-to-End Rescue Architecture
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-warm-200 shadow-sm space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center">
                1
              </div>
              <div className="flex items-center space-x-2 text-warm-900 font-bold text-sm">
                <Utensils className="w-4 h-4 text-brand-600" />
                <span>Food Donor</span>
              </div>
              <p className="text-xs text-warm-500 leading-relaxed">
                Bistro or campus kitchen lists surplus portions with food category, quantity, dietary tags, and collection deadline.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-warm-200 shadow-sm space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center">
                2
              </div>
              <div className="flex items-center space-x-2 text-warm-900 font-bold text-sm">
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>Verified NGO</span>
              </div>
              <p className="text-xs text-warm-500 leading-relaxed">
                Community shelter reviews available listings and claims portions with atomic concurrency reservation.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-warm-200 shadow-sm space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                3
              </div>
              <div className="flex items-center space-x-2 text-warm-900 font-bold text-sm">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Volunteer Courier</span>
              </div>
              <p className="text-xs text-warm-500 leading-relaxed">
                Accepts pickup task, travels with verified thermal containers, and updates live GPS & delivery states.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-warm-200 shadow-sm space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                4
              </div>
              <div className="flex items-center space-x-2 text-warm-900 font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Verified Handoff</span>
              </div>
              <p className="text-xs text-warm-500 leading-relaxed">
                NGO confirms arrival and food condition. System marks delivery complete and awards non-duplicable reward points.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
