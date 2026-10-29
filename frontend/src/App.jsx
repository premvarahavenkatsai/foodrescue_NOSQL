import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import LandingPage from './pages/LandingPage';
import BrowseDonations from './pages/BrowseDonations';
import DonorDashboard from './pages/DonorDashboard';
import NgoDashboard from './pages/NgoDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import LeaderboardPage from './pages/LeaderboardPage';
import CertificatePage from './pages/CertificatePage';
import AdminDashboard from './pages/AdminDashboard';
import ProfilePage from './pages/ProfilePage';
import MlDashboard from './pages/MlDashboard';
import AuthModal from './pages/AuthModal';
import AuthPage from './pages/AuthPage';

import { AlertCircle, Home } from 'lucide-react';

function AppContent() {
  const { user, isAuthenticated, loading } = useAuth();
  const [currentView, setCurrentView] = useState('landing');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const openAuth = (mode = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  // Render view based on state
  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage setCurrentView={setCurrentView} onOpenAuth={openAuth} />;
      case 'browse':
        return <BrowseDonations onOpenAuth={openAuth} />;
      case 'donor-dashboard':
        if (!isAuthenticated || (user?.role !== 'donor' && user?.role !== 'admin')) {
          return (
            <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-2xl border border-warm-200 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
              <h2 className="text-lg font-bold text-warm-900">Donor Access Required</h2>
              <p className="text-xs text-warm-500">
                Please log in with a Food Donor account or use the Demo Switcher in the top navigation.
              </p>
              <button
                onClick={openAuth}
                className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
              >
                Sign In
              </button>
            </div>
          );
        }
        return <DonorDashboard />;
      case 'ngo-dashboard':
        if (!isAuthenticated || (user?.role !== 'ngo' && user?.role !== 'admin')) {
          return (
            <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-2xl border border-warm-200 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
              <h2 className="text-lg font-bold text-warm-900">NGO Access Required</h2>
              <p className="text-xs text-warm-500">
                Please log in with an NGO / Shelter account or use the Demo Switcher.
              </p>
              <button
                onClick={openAuth}
                className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
              >
                Sign In
              </button>
            </div>
          );
        }
        return <NgoDashboard setCurrentView={setCurrentView} />;
      case 'volunteer-dashboard':
        if (!isAuthenticated || (user?.role !== 'volunteer' && user?.role !== 'admin')) {
          return (
            <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-2xl border border-warm-200 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
              <h2 className="text-lg font-bold text-warm-900">Volunteer Access Required</h2>
              <p className="text-xs text-warm-500">
                Please log in with a Volunteer Courier account or use the Demo Switcher.
              </p>
              <button
                onClick={openAuth}
                className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
              >
                Sign In
              </button>
            </div>
          );
        }
        return <VolunteerDashboard setCurrentView={setCurrentView} />;
      case 'leaderboard':
        return <LeaderboardPage />;
      case 'certificate':
        return <CertificatePage setCurrentView={setCurrentView} />;
      case 'admin-dashboard':
        if (!isAuthenticated || user?.role !== 'admin') {
          return (
            <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-2xl border border-warm-200 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
              <h2 className="text-lg font-bold text-warm-900">Administrator Clearance Required</h2>
              <p className="text-xs text-warm-500">
                This console is restricted to system administrators. Use the Demo Switcher to log in as Vikram Malhotra (Admin).
              </p>
              <button
                onClick={openAuth}
                className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
              >
                Sign In
              </button>
            </div>
          );
        }
        return <AdminDashboard />;
      case 'profile':
        return <ProfilePage />;
      case 'ml-dashboard':
        return <MlDashboard />;
      default:
        return (
          <div className="max-w-md mx-auto my-24 p-8 bg-white rounded-2xl border border-warm-200 text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-warm-800">404</h2>
            <p className="text-sm font-semibold text-warm-700">Page Not Found</p>
            <p className="text-xs text-warm-500">The requested page does not exist or has moved.</p>
            <button
              onClick={() => setCurrentView('landing')}
              className="mt-4 px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 mx-auto"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Return Home</span>
            </button>
          </div>
        );
    }
  };

  // Dedicated Full-Screen Split View for Login / Sign Up (Exact match to reference screenshot)
  if (currentView === 'login' || currentView === 'register') {
    return (
      <AuthPage
        initialMode={currentView}
        setCurrentView={setCurrentView}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-warm-50">
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenAuth={openAuth}
      />

      <main className="flex-1">
        {renderView()}
      </main>

      <Footer />

      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
