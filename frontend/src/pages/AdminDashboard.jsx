import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import {
  ShieldCheck,
  Building2,
  Users,
  Utensils,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileSpreadsheet,
  Search,
  Filter
} from 'lucide-react';

const COLORS = ['#16a34a', '#eab308', '#3b82f6', '#a855f7', '#ec4899', '#f97316', '#64748b'];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'ngos', 'users', 'donations'
  const [kpis, setKpis] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [ngoStats, setNgoStats] = useState([]);
  const [donorStats, setDonorStats] = useState([]);

  // Admin Tables Data
  const [orgs, setOrgs] = useState([]);
  const [users, setUsers] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  // Search/Filters
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [
        kpisRes,
        trendRes,
        catRes,
        ngoRes,
        donorRes,
        orgsRes,
        usersRes,
        donRes
      ] = await Promise.all([
        api.getKpis(),
        api.getRescuedTrend('day'),
        api.getCategoryBreakdown(),
        api.getNgoFulfillment(),
        api.getDonorContributions(),
        api.getAdminOrganizations(),
        api.getAdminUsers(),
        api.getAdminDonations()
      ]);

      setKpis(kpisRes.kpis || {});
      setTrendData(trendRes.trend || []);
      setCategoryData(catRes.breakdown || []);
      setNgoStats(ngoRes.fulfillment || []);
      setDonorStats(donorRes.donors || []);
      setOrgs(orgsRes.organizations || []);
      setUsers(usersRes.users || []);
      setDonations(donRes.donations || []);
    } catch (err) {
      console.error("Admin data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const handleVerifyOrg = async (orgId, status) => {
    try {
      await api.verifyOrganization(orgId, status);
      setActionMessage(`Organization verification status updated to '${status}'.`);
      // Refresh orgs
      const res = await api.getAdminOrganizations();
      setOrgs(res.organizations || []);
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      alert(err.message || 'Failed to update verification status');
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.toggleUserStatus(userId, !currentStatus);
      setActionMessage(`User account status updated.`);
      // Refresh users
      const res = await api.getAdminUsers();
      setUsers(res.users || []);
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      alert(err.message || 'Failed to toggle user status');
    }
  };

  // Process Category Breakdown for Pie Chart
  const categoryTotals = {};
  categoryData.forEach(item => {
    categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.totalQuantityKg;
  });
  const pieChartData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value: Math.round(value * 10) / 10
  }));

  const filteredUsers = users.filter(u => {
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchesSearch = !userSearch || u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-warm-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[11px] font-bold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="text-2xl font-bold text-warm-900 tracking-tight">System Analytics & Management</h1>
          <p className="text-xs text-warm-500">Live MongoDB Aggregation pipelines and regulatory compliance monitoring.</p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-warm-100 p-1 rounded-xl text-xs font-semibold">
          {[
            { key: 'analytics', label: 'Aggregation Analytics' },
            { key: 'ngos', label: `Verify NGOs (${orgs.filter(o => o.verificationStatus === 'pending').length})` },
            { key: 'users', label: 'Users' },
            { key: 'donations', label: 'Listing Audits' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === tab.key ? 'bg-white text-warm-900 shadow-sm' : 'text-warm-600 hover:text-warm-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-warm-200 shadow-xs">
            <div className="text-[10px] font-semibold text-warm-400 uppercase">Rescued Food</div>
            <div className="text-2xl font-black text-brand-700 mt-1">{kpis.totalRescuedKg} kg</div>
            <div className="text-[10px] text-warm-500 mt-0.5">{kpis.estimatedMeals} meals served</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-warm-200 shadow-xs">
            <div className="text-[10px] font-semibold text-warm-400 uppercase">Total Deliveries</div>
            <div className="text-2xl font-black text-warm-900 mt-1">{kpis.completedDeliveries}</div>
            <div className="text-[10px] text-warm-500 mt-0.5">Verified Handoffs</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-warm-200 shadow-xs">
            <div className="text-[10px] font-semibold text-warm-400 uppercase">Registered Donors</div>
            <div className="text-2xl font-black text-warm-900 mt-1">{kpis.donorsCount}</div>
            <div className="text-[10px] text-warm-500 mt-0.5">Active Kitchens</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-warm-200 shadow-xs">
            <div className="text-[10px] font-semibold text-warm-400 uppercase">Couriers</div>
            <div className="text-2xl font-black text-warm-900 mt-1">{kpis.volunteersCount}</div>
            <div className="text-[10px] text-warm-500 mt-0.5">Verified Volunteers</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-warm-200 shadow-xs">
            <div className="text-[10px] font-semibold text-warm-400 uppercase">Shelters & NGOs</div>
            <div className="text-2xl font-black text-warm-900 mt-1">{kpis.verifiedNgosCount} / {kpis.ngosCount}</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">{kpis.pendingNgosCount} pending audit</div>
          </div>
        </div>
      )}

      {/* TAB 1: ANALYTICS WITH RECHARTS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Rescued Food Trend */}
            <div className="bg-white p-5 rounded-2xl border border-warm-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-warm-900">Food Rescued Over Time (kg)</h3>
                  <p className="text-[11px] text-warm-500">Pipeline 1: Strictly verified completed rescues</p>
                </div>
                <span className="text-[10px] font-mono bg-brand-50 text-brand-700 px-2 py-0.5 rounded border border-brand-200">
                  $group by date
                </span>
              </div>

              <div className="h-64 w-full">
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="rescuedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                      <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#78716c' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#78716c' }} unit=" kg" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="totalRescuedKg" stroke="#16a34a" strokeWidth={2.5} fillOpacity={1} fill="url(#rescuedGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-warm-400">
                    No trend data points yet
                  </div>
                )}
              </div>
            </div>

            {/* Chart 2: Category Distribution */}
            <div className="bg-white p-5 rounded-2xl border border-warm-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-warm-900">Food Category Distribution</h3>
                  <p className="text-[11px] text-warm-500">Pipeline 5: Total volume by food classification</p>
                </div>
                <span className="text-[10px] font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                  $group by category
                </span>
              </div>

              <div className="h-64 w-full">
                {pieChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-warm-400">
                    No category data points yet
                  </div>
                )}
              </div>
            </div>

            {/* Chart 3: NGO Fulfillment Stats */}
            <div className="bg-white p-5 rounded-2xl border border-warm-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-warm-900">NGO Request Fulfillment Rates</h3>
                  <p className="text-[11px] text-warm-500">Pipeline 6: Requests submitted vs delivered</p>
                </div>
                <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                  $cond & $multiply
                </span>
              </div>

              <div className="h-64 w-full">
                {ngoStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ngoStats}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                      <XAxis dataKey="organizationName" tick={{ fontSize: 11, fill: '#78716c' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#78716c' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4', fontSize: '12px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="totalRequests" name="Total Requests" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="fulfilledCount" name="Fulfilled" fill="#16a34a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-warm-400">
                    No NGO fulfillment data yet
                  </div>
                )}
              </div>
            </div>

            {/* Chart 4: Top Donors Contributions */}
            <div className="bg-white p-5 rounded-2xl border border-warm-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-warm-900">Top Food Donors (kg)</h3>
                  <p className="text-[11px] text-warm-500">Pipeline 2: Food volume contributed by each commercial donor</p>
                </div>
                <span className="text-[10px] font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                  $lookup & $sum
                </span>
              </div>

              <div className="h-64 w-full">
                {donorStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={donorStats} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f5f5f4" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#78716c' }} unit=" kg" />
                      <YAxis type="category" dataKey="donorName" tick={{ fontSize: 11, fill: '#78716c' }} width={120} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e7e5e4', fontSize: '12px' }}
                      />
                      <Bar dataKey="totalDonatedKg" name="Total Donated (kg)" fill="#eab308" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-warm-400">
                    No donor statistics yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NGO VERIFICATION */}
      {activeTab === 'ngos' && (
        <div className="bg-white rounded-2xl border border-warm-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-warm-200">
            <h2 className="text-sm font-bold text-warm-900">NGO & Shelter Verification Audits</h2>
            <p className="text-xs text-warm-500">Review pending shelter applications before granting food request privileges.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-warm-700">
              <thead className="bg-warm-50 text-[11px] font-semibold text-warm-500 uppercase border-b border-warm-200">
                <tr>
                  <th className="px-5 py-3">Organization Name</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Service Area</th>
                  <th className="px-5 py-3">Verification Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {orgs.map((o) => (
                  <tr key={o.id || o._id} className="hover:bg-warm-50/50">
                    <td className="px-5 py-3.5 font-bold text-warm-900">{o.organizationName}</td>
                    <td className="px-5 py-3.5 text-warm-600">{o.organizationType}</td>
                    <td className="px-5 py-3.5 text-warm-600">{o.serviceArea}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={o.verificationStatus} />
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      {o.verificationStatus !== 'verified' && (
                        <button
                          onClick={() => handleVerifyOrg(o.id || o._id, 'verified')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold"
                        >
                          Approve
                        </button>
                      )}
                      {o.verificationStatus !== 'rejected' && (
                        <button
                          onClick={() => handleVerifyOrg(o.id || o._id, 'rejected')}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-semibold"
                        >
                          Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-warm-200 shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-sm font-bold text-warm-900">User Account Administration</h2>
              <p className="text-xs text-warm-500">Manage account activation flags and access rights.</p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="px-3 py-1.5 text-xs border border-warm-300 rounded-lg focus:outline-none"
              />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-warm-300 rounded-lg focus:outline-none capitalize"
              >
                <option value="all">All Roles</option>
                <option value="donor">Donor</option>
                <option value="ngo">NGO</option>
                <option value="volunteer">Volunteer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto -mx-5 -mb-5">
            <table className="w-full text-left text-xs text-warm-700">
              <thead className="bg-warm-50 text-[11px] font-semibold text-warm-500 uppercase border-y border-warm-200">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id || u._id} className="hover:bg-warm-50/50">
                    <td className="px-5 py-3 font-bold text-warm-900">{u.name}</td>
                    <td className="px-5 py-3 text-warm-500">{u.email}</td>
                    <td className="px-5 py-3 capitalize font-semibold text-warm-800">{u.role}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleToggleUserStatus(u.id || u._id, u.isActive)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded ${
                          u.isActive
                            ? 'bg-warm-100 hover:bg-rose-100 text-warm-700 hover:text-rose-700'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DONATION AUDIT */}
      {activeTab === 'donations' && (
        <div className="bg-white rounded-2xl border border-warm-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-warm-200">
            <h2 className="text-sm font-bold text-warm-900">Platform Food Donation Audits</h2>
            <p className="text-xs text-warm-500">Comprehensive trace log of all food rescue listings across system.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-warm-700">
              <thead className="bg-warm-50 text-[11px] font-semibold text-warm-500 uppercase border-b border-warm-200">
                <tr>
                  <th className="px-5 py-3">Food Name</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Quantity</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {donations.map((d) => (
                  <tr key={d.id || d._id} className="hover:bg-warm-50/50">
                    <td className="px-5 py-3 font-bold text-warm-900">{d.foodName}</td>
                    <td className="px-5 py-3">{d.category}</td>
                    <td className="px-5 py-3 font-semibold text-warm-900">{d.quantityKg} kg</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-5 py-3 text-warm-500">
                      {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
