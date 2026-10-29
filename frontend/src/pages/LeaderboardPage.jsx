import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Award, Trophy, Medal, Sparkles, Truck, Package, Heart } from 'lucide-react';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await api.getLeaderboard(15);
        setLeaderboard(res.leaderboard || []);
      } catch (err) {
        setError(err.message || 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  const getRankBadge = (rank) => {
    if (rank === 1) return <span className="w-8 h-8 rounded-full bg-amber-400 text-amber-950 font-black flex items-center justify-center text-sm shadow-md">🥇</span>;
    if (rank === 2) return <span className="w-8 h-8 rounded-full bg-slate-300 text-slate-800 font-black flex items-center justify-center text-sm shadow-md">🥈</span>;
    if (rank === 3) return <span className="w-8 h-8 rounded-full bg-amber-600 text-white font-black flex items-center justify-center text-sm shadow-md">🥉</span>;
    return <span className="w-8 h-8 rounded-full bg-warm-100 text-warm-700 font-bold flex items-center justify-center text-xs">#{rank}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
          <Trophy className="w-4 h-4 text-amber-600" />
          <span>Verified Volunteer Leaderboard</span>
        </div>
        <h1 className="text-3xl font-extrabold text-warm-900 tracking-tight">
          Community Food Rescue Heroes
        </h1>
        <p className="text-xs text-warm-500">
          Rankings are calculated dynamically from verified MongoDB delivery tasks. Points are granted strictly upon confirmed recipient handoffs.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-warm-500">Computing leaderboard rankings...</div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center">
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-warm-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-warm-700">
              <thead className="bg-warm-50 text-[11px] font-semibold text-warm-500 uppercase border-b border-warm-200">
                <tr>
                  <th className="px-6 py-4 text-center w-16">Rank</th>
                  <th className="px-6 py-4">Volunteer</th>
                  <th className="px-6 py-4">Transport Mode</th>
                  <th className="px-6 py-4 text-center">Verified Deliveries</th>
                  <th className="px-6 py-4 text-center">Rescued Food (kg)</th>
                  <th className="px-6 py-4 text-center">Reward Points</th>
                  <th className="px-6 py-4">Achievements</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {leaderboard.map((v) => (
                  <tr key={v.volunteerId} className="hover:bg-warm-50/60 transition">
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        {getRankBadge(v.rank)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-warm-900 text-sm">{v.name}</div>
                      <div className="text-[11px] text-warm-400">{v.email}</div>
                    </td>
                    <td className="px-6 py-4 capitalize font-medium text-warm-700">
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-warm-100 text-[11px]">
                        <Truck className="w-3.5 h-3.5 text-warm-500" />
                        <span>{v.transportType || 'Standard'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-warm-900 text-sm">
                      {v.totalDeliveries}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-brand-700 text-sm">
                      {v.totalFoodDeliveredKg} kg
                    </td>
                    <td className="px-6 py-4 text-center font-black text-amber-600 text-base">
                      {v.totalPoints}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {v.badges && v.badges.length > 0 ? (
                          v.badges.map((b, idx) => (
                            <span key={idx} className="text-[10px] bg-brand-50 border border-brand-200 text-brand-800 px-2 py-0.5 rounded font-semibold flex items-center space-x-1">
                              <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                              <span>{b}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-warm-400 italic">No badges yet</span>
                        )}
                      </div>
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
