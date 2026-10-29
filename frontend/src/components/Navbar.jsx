import React, { useState } from 'react';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext';
import {
  HeartHandshake,
  LayoutDashboard,
  PlusCircle,
  Truck,
  Award,
  Building2,
  ShieldCheck,
  User,
  LogOut,
  ChevronDown,
  Sparkles,
  Search,
  Brain
} from 'lucide-react';

export default function Navbar({ currentView, setCurrentView, onOpenAuth }) {
  const { user, isAuthenticated, logout, quickLogin } = useAuth();
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const role = user?.role;

  const handleDemoSwitch = async (roleKey) => {
    setDemoMenuOpen(false);
    await quickLogin(roleKey);
    // Switch to role dashboard
    if (roleKey === 'donor') setCurrentView('donor-dashboard');
    else if (roleKey === 'ngo') setCurrentView('ngo-dashboard');
    else if (roleKey === 'volunteer') setCurrentView('volunteer-dashboard');
    else if (roleKey === 'admin') setCurrentView('admin-dashboard');
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-warm-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentView('landing')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-warm-900">
                Food<span className="text-brand-600">Rescue</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-semibold bg-brand-100 text-brand-800 rounded">
                NoSQL
              </span>
            </div>
          </div>

          {/* Center Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => setCurrentView('browse')}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                currentView === 'browse'
                  ? 'bg-brand-50 text-brand-700 font-semibold'
                  : 'text-warm-600 hover:text-warm-900 hover:bg-warm-100'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Browse Food</span>
            </button>

            <button
              onClick={() => setCurrentView('leaderboard')}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                currentView === 'leaderboard'
                  ? 'bg-brand-50 text-brand-700 font-semibold'
                  : 'text-warm-600 hover:text-warm-900 hover:bg-warm-100'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Leaderboard</span>
            </button>

            <button
              onClick={() => setCurrentView('ml-dashboard')}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                currentView === 'ml-dashboard'
                  ? 'bg-brand-50 text-brand-700 font-semibold'
                  : 'text-warm-600 hover:text-warm-900 hover:bg-warm-100'
              }`}
            >
              <Brain className="w-4 h-4 text-brand-600" />
              <span>ML Intelligence</span>
            </button>

            {/* Role-Specific Portal Button */}
            {isAuthenticated && role === 'donor' && (
              <>
                <button
                  onClick={() => setCurrentView('donor-dashboard')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                    currentView === 'donor-dashboard'
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-warm-600 hover:text-warm-900 hover:bg-warm-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Donor Dashboard</span>
                </button>
              </>
            )}

            {isAuthenticated && role === 'ngo' && (
              <button
                onClick={() => setCurrentView('ngo-dashboard')}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                  currentView === 'ngo-dashboard'
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-warm-600 hover:text-warm-900 hover:bg-warm-100'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>NGO Requests</span>
              </button>
            )}

            {isAuthenticated && role === 'volunteer' && (
              <button
                onClick={() => setCurrentView('volunteer-dashboard')}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                  currentView === 'volunteer-dashboard'
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-warm-600 hover:text-warm-900 hover:bg-warm-100'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Rescue Tasks</span>
              </button>
            )}

            {isAuthenticated && role === 'admin' && (
              <button
                onClick={() => setCurrentView('admin-dashboard')}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                  currentView === 'admin-dashboard'
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-warm-600 hover:text-warm-900 hover:bg-warm-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Analytics</span>
              </button>
            )}
          </div>

          {/* Right Controls: Quick Demo Switcher & User Profile */}
          <div className="flex items-center space-x-3">
            {/* Quick Demo Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 rounded-lg hover:bg-amber-100 transition shadow-sm"
                title="Quickly switch roles for demonstration and grading"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Demo Switcher</span>
                <ChevronDown className="w-3 h-3 text-amber-600" />
              </button>

              {demoMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-warm-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 border-b border-warm-100 text-[11px] font-semibold uppercase tracking-wider text-warm-400">
                    Switch Test Account
                  </div>
                  {Object.entries(DEMO_CREDENTIALS).map(([key, cred]) => (
                    <button
                      key={key}
                      onClick={() => handleDemoSwitch(key)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-warm-50 transition ${
                        role === key ? 'bg-brand-50 font-semibold text-brand-800' : 'text-warm-700'
                      }`}
                    >
                      <div>
                        <div className="capitalize font-medium">{cred.label}</div>
                        <div className="text-[10px] text-warm-400">{cred.email}</div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-warm-100 text-warm-600 uppercase font-mono">
                        {key}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth Buttons or User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-lg border border-warm-200 hover:border-warm-300 bg-white transition"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                    {user?.name?.[0] || 'U'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-semibold text-warm-900 leading-tight">{user?.name}</div>
                    <div className="text-[10px] font-medium text-brand-700 capitalize leading-tight">{user?.role}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-warm-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-warm-200 py-1.5 z-50">
                    <div className="px-3 py-2 border-b border-warm-100">
                      <p className="text-xs font-semibold text-warm-900">{user?.name}</p>
                      <p className="text-[11px] text-warm-500 truncate">{user?.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        setCurrentView('profile');
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-warm-700 hover:bg-warm-50 flex items-center space-x-2"
                    >
                      <User className="w-4 h-4 text-warm-500" />
                      <span>Profile & Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                        setCurrentView('landing');
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2 border-t border-warm-100"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentView('login')}
                  className="px-3.5 py-1.5 rounded-lg text-warm-700 hover:text-warm-900 hover:bg-warm-100 text-xs font-semibold transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setCurrentView('register')}
                  className="px-3.5 py-1.5 rounded-lg bg-[#00c9a7] hover:bg-[#00b395] text-white text-xs font-semibold shadow-sm shadow-teal-500/25 transition"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
