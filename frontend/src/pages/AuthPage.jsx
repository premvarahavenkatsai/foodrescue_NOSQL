import React, { useState, useEffect } from 'react';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext';
import {
  Sparkles,
  Building2,
  Truck,
  Utensils,
  ShieldCheck,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  Clock,
  TrendingUp,
  HeartHandshake,
  CheckCircle2,
  Database,
  Award,
  FileText,
  Heart,
  Zap,
  ArrowLeft,
  ChevronRight,
  Home
} from 'lucide-react';

export const SLIDES = [
  {
    category: "BENEFITS FOR DONORS",
    title: "Benefits for Food Donors",
    subtitle: "Turn surplus dining portions into verified community meals within minutes while maintaining FSSAI safety compliance.",
    image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=1400&q=80",
    gradient: "from-emerald-950/90 via-warm-950/85 to-black/90",
    // 5 Badges arranged in 3 (top row) + 2 (bottom row centered), matching reference screenshot
    row1: [
      { icon: Utensils, text: "Instant Listing" },
      { icon: Clock, text: "Freshness Tracking" },
      { icon: TrendingUp, text: "Tax & CSR Analytics" }
    ],
    row2: [
      { icon: ShieldCheck, text: "FSSAI Safety" },
      { icon: Building2, text: "Shelter Distribution" }
    ]
  },
  {
    category: "BENEFITS FOR NGOS & SHELTERS",
    title: "Benefits for Shelters & NGOs",
    subtitle: "Directly claim freshly cooked meals from trusted local hotels, banquet halls, and university messes.",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1400&q=80",
    gradient: "from-teal-950/90 via-slate-950/85 to-black/90",
    row1: [
      { icon: HeartHandshake, text: "Zero Cost Food" },
      { icon: ShieldCheck, text: "Atomic Reservation" },
      { icon: MapPin, text: "Live Courier GPS" }
    ],
    row2: [
      { icon: CheckCircle2, text: "Verified Handoff" },
      { icon: Utensils, text: "Nourish Hundreds" }
    ]
  },
  {
    category: "BENEFITS FOR VOLUNTEERS",
    title: "Empowering Citizen Food Heroes",
    subtitle: "Collect packed portions from donors and transport them safely using your bicycle, motorcycle, car, or van.",
    image: "https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=1400&q=80",
    gradient: "from-blue-950/90 via-warm-950/85 to-black/90",
    row1: [
      { icon: Truck, text: "Flexible Missions" },
      { icon: Award, text: "Verified Points" },
      { icon: Sparkles, text: "Unlock Badges" }
    ],
    row2: [
      { icon: FileText, text: "Official Certificate" },
      { icon: Heart, text: "Direct Impact" }
    ]
  },
  {
    category: "INTELLIGENT NOSQL ENGINE",
    title: "Powered by MongoDB 8.0 & PyMongo",
    subtitle: "Engineered for high-throughput coordination with strict database-level validation and multi-stage aggregation.",
    image: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=1400&q=80",
    gradient: "from-purple-950/90 via-emerald-950/85 to-black/90",
    row1: [
      { icon: Database, text: "Schema Validation" },
      { icon: TrendingUp, text: "6+ Aggregations" },
      { icon: Zap, text: "Sub-ms Queries" }
    ],
    row2: [
      { icon: Lock, text: "Atomic Locking" },
      { icon: CheckCircle2, text: "100% Traceability" }
    ]
  }
];

export default function AuthPage({ initialMode = 'login', setCurrentView, onClose }) {
  const { login, register, quickLogin, user } = useAuth();
  const [isRegister, setIsRegister] = useState(initialMode === 'register');
  const [role, setRole] = useState('donor');
  const [activeSlide, setActiveSlide] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [authMethod, setAuthMethod] = useState('password'); // 'password' or 'demo'
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    organizationName: '',
    organizationType: 'Community Kitchen & Food Pantry',
    serviceArea: '',
    transportType: 'car',
    transportCapacityKg: 25
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync mode if initialMode prop changes
  useEffect(() => {
    setIsRegister(initialMode === 'register');
    setError('');
  }, [initialMode]);

  // Auto-slide effect every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentSlide = SLIDES[activeSlide];

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePostAuthRedirect = (loggedInUser) => {
    if (onClose) onClose();
    if (setCurrentView) {
      const uRole = loggedInUser?.role || role;
      if (uRole === 'donor') setCurrentView('donor-dashboard');
      else if (uRole === 'ngo') setCurrentView('ngo-dashboard');
      else if (uRole === 'volunteer') setCurrentView('volunteer-dashboard');
      else if (uRole === 'admin') setCurrentView('admin-dashboard');
      else setCurrentView('landing');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        const res = await register({ ...formData, role });
        handlePostAuthRedirect(res?.user);
      } else {
        const res = await login(formData.email, formData.password);
        handlePostAuthRedirect(res?.user);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (roleKey) => {
    setError('');
    setLoading(true);
    try {
      const res = await quickLogin(roleKey);
      handlePostAuthRedirect(res?.user);
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white relative font-sans">

      {/* =========================================================================
          LEFT HALF: SLIDING FEATURE SHOWCASE (PIXEL-ACCURATE TO REFERENCE SCREENSHOT)
      ========================================================================== */}
      <div className="lg:w-1/2 min-h-[480px] lg:min-h-screen relative bg-slate-950 text-white p-6 sm:p-12 lg:p-16 flex flex-col justify-between overflow-hidden select-none">
        
        {/* Background Image Carousel with Cross-Fade */}
        {SLIDES.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out ${
              activeSlide === idx
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-105 pointer-events-none'
            }`}
            style={{
              backgroundImage: `url(${slide.image})`,
              transitionProperty: 'opacity, transform'
            }}
          />
        ))}

        {/* Cinematic Gradient Overlays */}
        <div className={`absolute inset-0 bg-gradient-to-br ${currentSlide.gradient} transition-colors duration-1000`} />
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" />

        {/* Top Header: Logo + Back to Home */}
        <div className="relative z-10 flex items-center justify-between">
          <div
            onClick={() => setCurrentView && setCurrentView('landing')}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#00c9a7] flex items-center justify-center text-white shadow-lg shadow-teal-500/30 group-hover:scale-105 transition transform">
              <HeartHandshake className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xl font-extrabold tracking-tight text-white flex items-center space-x-1">
                <span>Food</span>
                <span className="text-[#00c9a7]">Rescue</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-white/15 rounded text-teal-200 ml-1">
                  India
                </span>
              </div>
            </div>
          </div>

          {setCurrentView && (
            <button
              onClick={() => setCurrentView('landing')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs text-warm-100 backdrop-blur-sm transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
          )}
        </div>

        {/* Center Content: Title, Subtitle, and 5 Circular Icons (3 on top row, 2 on bottom row) */}
        <div className="relative z-10 my-auto py-8 sm:py-12 space-y-8 max-w-lg mx-auto lg:mx-0 w-full text-center">
          
          {/* Header Texts */}
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {currentSlide.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-200/90 font-normal leading-relaxed max-w-md mx-auto">
              {currentSlide.subtitle}
            </p>
          </div>

          {/* 5 Circular Badges in 3 + 2 Layout (Exactly as Reference Image) */}
          <div className="space-y-4 pt-2">
            
            {/* Top Row: 3 Circular Badges */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 justify-items-center">
              {currentSlide.row1.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex flex-col items-center space-y-2 group max-w-[110px]">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-teal-900/60 group-hover:bg-teal-900/80 border border-teal-400/50 flex items-center justify-center backdrop-blur-md shadow-lg shadow-teal-950/40 transition transform group-hover:scale-105">
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-[#00c9a7]" />
                    </div>
                    <span className="text-[11px] sm:text-xs font-medium text-white/95 text-center leading-tight">
                      {item.text}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom Row: 2 Circular Badges Centered */}
            <div className="flex justify-center items-start space-x-6 sm:space-x-10">
              {currentSlide.row2.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex flex-col items-center space-y-2 group max-w-[110px]">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-teal-900/60 group-hover:bg-teal-900/80 border border-teal-400/50 flex items-center justify-center backdrop-blur-md shadow-lg shadow-teal-950/40 transition transform group-hover:scale-105">
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-[#00c9a7]" />
                    </div>
                    <span className="text-[11px] sm:text-xs font-medium text-white/95 text-center leading-tight">
                      {item.text}
                    </span>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* Bottom Slide Info & Controls */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-300 pt-4 border-t border-white/10">
          <span className="font-mono text-[11px] text-teal-300 font-semibold tracking-wider">
            FEATURE 0{activeSlide + 1} / 0{SLIDES.length}
          </span>
          <div className="flex space-x-2">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeSlide === idx ? 'w-7 bg-[#00c9a7]' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* =========================================================================
            CENTER VERTICAL PILL SLIDER INDICATOR (EXACTLY AS REFERENCE IMAGE)
        ========================================================================== */}
        <div className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-30">
          <div className="bg-white rounded-full shadow-2xl border border-gray-200 py-3.5 px-1.5 flex flex-col items-center space-y-2.5">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className="group relative flex items-center justify-center p-0.5 focus:outline-none transition"
                title={`Feature ${idx + 1}`}
              >
                {activeSlide === idx ? (
                  <span className="w-2.5 h-6 bg-[#00c9a7] rounded-full shadow-md shadow-teal-500/40 transition-all duration-300" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-gray-300 group-hover:bg-gray-400 transition-all duration-200" />
                )}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* =========================================================================
          RIGHT HALF: MODERN AUTHENTICATION FORM (EXACTLY AS REFERENCE SCREENSHOT)
      ========================================================================== */}
      <div className="lg:w-1/2 min-h-screen bg-white p-6 sm:p-12 lg:p-16 flex flex-col justify-center items-center relative overflow-y-auto">
        
        {/* Optional Close Button if rendered as modal */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition z-20"
            aria-label="Close"
          >
            ✕
          </button>
        )}

        <div className="max-w-md w-full space-y-6 my-auto">
          
          {/* Main Titles */}
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-snug">
              {isRegister
                ? "Join India's Largest Food Rescue Network!"
                : "Nourishing communities, from surplus to smiles!"}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-normal">
              {isRegister
                ? "Create an account to start rescuing surplus food today."
                : "Welcome back, please log in to access your portal."}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Toggle Tabs: Password vs 1-Click Demo (Style matching Reference Image) */}
          {!isRegister && (
            <div className="grid grid-cols-2 bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAuthMethod('password')}
                className={`py-2 rounded-lg transition flex items-center justify-center space-x-2 ${
                  authMethod === 'password'
                    ? 'bg-white text-[#00c9a7] shadow-sm font-bold'
                    : 'text-gray-500 hover:text-gray-800 font-medium'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-[#00c9a7]" />
                <span>Password</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthMethod('demo')}
                className={`py-2 rounded-lg transition flex items-center justify-center space-x-2 ${
                  authMethod === 'demo'
                    ? 'bg-white text-amber-600 shadow-sm font-bold'
                    : 'text-gray-500 hover:text-gray-800 font-medium'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>1-Click Demo</span>
              </button>
            </div>
          )}

          {/* Form Content */}
          {authMethod === 'password' || isRegister ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Registration Role Selector */}
              {isRegister && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700">
                    Select Your Role *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'donor', label: 'Food Donor', icon: Utensils },
                      { key: 'ngo', label: 'Shelter / NGO', icon: Building2 },
                      { key: 'volunteer', label: 'Volunteer', icon: Truck },
                    ].map(r => {
                      const Icon = r.icon;
                      return (
                        <button
                          key={r.key}
                          type="button"
                          onClick={() => setRole(r.key)}
                          className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center space-y-1 ${
                            role === r.key
                              ? 'border-[#00c9a7] bg-teal-50 text-[#008f75] font-bold shadow-xs'
                              : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                          }`}
                        >
                          <Icon className="w-4 h-4 text-[#00c9a7]" />
                          <span className="text-[11px]">{r.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Registration Name Field */}
              {isRegister && (
                <div>
                  <div className="border border-gray-200 rounded-xl px-3.5 py-2.5 focus-within:border-[#00c9a7] focus-within:ring-2 focus-within:ring-teal-400/20 bg-white transition">
                    <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                      {role === 'ngo' ? 'Representative Full Name *' : 'Your Full Name *'}
                    </label>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <input
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full text-xs text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* NGO Organization Name */}
              {isRegister && role === 'ngo' && (
                <div>
                  <div className="border border-gray-200 rounded-xl px-3.5 py-2.5 focus-within:border-[#00c9a7] focus-within:ring-2 focus-within:ring-teal-400/20 bg-white transition">
                    <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                      Organization / Shelter Name *
                    </label>
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <input
                        name="organizationName"
                        required
                        value={formData.organizationName}
                        onChange={handleChange}
                        placeholder="e.g. Roti Bank Seva Trust"
                        className="w-full text-xs text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Email Address Field (Distinct Teal Outlined Box Matching Reference Image) */}
              <div>
                <div className="border-2 border-[#00c9a7] rounded-xl px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-teal-400/20 bg-white shadow-xs transition">
                  <label className="block text-[11px] font-bold text-[#00a88b] mb-0.5">
                    Enter your email address *
                  </label>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. rahul.sharma@example.in"
                      className="w-full text-xs text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Password Field with Eye Toggle (Matching Reference Image) */}
              <div>
                <div className="border border-gray-200 rounded-xl px-3.5 py-2.5 focus-within:border-[#00c9a7] focus-within:ring-2 focus-within:ring-teal-400/20 bg-white transition flex items-center justify-between">
                  <div className="flex-1 mr-2">
                    <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                      Enter your password *
                    </label>
                    <div className="flex items-center space-x-2">
                      <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full text-xs text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-700 focus:outline-none p-1"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Registration Extra Details: Phone & Address */}
              {isRegister && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border border-gray-200 rounded-xl px-3 py-2 bg-white">
                      <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Mobile (+91)</label>
                      <input
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91-98765-43210"
                        className="w-full text-xs text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
                      />
                    </div>
                    <div className="border border-gray-200 rounded-xl px-3 py-2 bg-white">
                      <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">City Zone</label>
                      <input
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Indiranagar, Bengaluru"
                        className="w-full text-xs text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  {role === 'volunteer' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="border border-gray-200 rounded-xl px-3 py-2 bg-white">
                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Transport</label>
                        <select
                          name="transportType"
                          value={formData.transportType}
                          onChange={handleChange}
                          className="w-full text-xs text-gray-800 focus:outline-none bg-transparent"
                        >
                          <option value="walking">Walking</option>
                          <option value="bicycle">Bicycle</option>
                          <option value="motorcycle">Motorcycle</option>
                          <option value="car">Car</option>
                          <option value="van">Van</option>
                        </select>
                      </div>
                      <div className="border border-gray-200 rounded-xl px-3 py-2 bg-white">
                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Capacity (kg)</label>
                        <input
                          type="number"
                          name="transportCapacityKg"
                          value={formData.transportCapacityKg}
                          onChange={handleChange}
                          className="w-full text-xs text-gray-800 focus:outline-none bg-transparent"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Forgot Password Link (Left-aligned as in reference) */}
              {!isRegister && (
                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={() => setForgotPasswordNotice(!forgotPasswordNotice)}
                    className="text-xs text-gray-500 hover:text-[#00c9a7] font-medium transition"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {forgotPasswordNotice && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  💡 For academic assignment grading, all pre-seeded Indian accounts use password: <strong className="font-mono">password123</strong>. Or use the 1-Click Indian Demo Logins below!
                </div>
              )}

              {/* Big Vibrant Teal Action Button (Matching Reference Screenshot) */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-[#00c9a7] hover:bg-[#00b395] active:bg-[#009e83] disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-teal-500/25 transition transform active:scale-[0.99] flex items-center justify-center space-x-2"
              >
                <span>{loading ? 'Authenticating...' : isRegister ? 'Create Free Account' : 'Log In'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Demo Tab Selection */
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Select any pre-configured Indian role to sign in instantly with full academic data:
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { key: 'admin', title: 'Vikram Malhotra', role: 'System Admin', icon: ShieldCheck, color: 'text-purple-600 bg-purple-50 border-purple-200' },
                  { key: 'donor', title: 'Annapurna Grand', role: 'Food Donor', icon: Utensils, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                  { key: 'ngo', title: 'Roti Bank Seva', role: 'Shelter / NGO', icon: Building2, color: 'text-blue-600 bg-blue-50 border-blue-200' },
                  { key: 'volunteer', title: 'Aarav Sharma', role: 'Courier Courier', icon: Truck, color: 'text-amber-600 bg-amber-50 border-amber-200' },
                ].map(acc => {
                  const Icon = acc.icon;
                  return (
                    <button
                      key={acc.key}
                      type="button"
                      onClick={() => handleQuickLogin(acc.key)}
                      disabled={loading}
                      className={`p-3 rounded-2xl border text-left transition hover:shadow-md flex flex-col justify-between ${acc.color}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <Icon className="w-4 h-4" />
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wider">Demo</span>
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-xs">{acc.title}</div>
                        <div className="text-[10px] text-gray-500 font-medium">{acc.role}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* OR Divider (Matching Reference Screenshot) */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
              OR
            </span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Evaluator Quick Action Button (Business Account Style from Reference) */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-left transition text-[11px]"
              >
                <div className="font-bold text-gray-800 truncate">Admin</div>
                <div className="text-[10px] text-gray-500 truncate">Vikram M.</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('donor')}
                className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-left transition text-[11px]"
              >
                <div className="font-bold text-gray-800 truncate">Donor</div>
                <div className="text-[10px] text-gray-500 truncate">Annapurna</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('ngo')}
                className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-left transition text-[11px]"
              >
                <div className="font-bold text-gray-800 truncate">NGO</div>
                <div className="text-[10px] text-gray-500 truncate">Roti Bank</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('volunteer')}
                className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-left transition text-[11px]"
              >
                <div className="font-bold text-gray-800 truncate">Volunteer</div>
                <div className="text-[10px] text-gray-500 truncate">Aarav S.</div>
              </button>
            </div>
          </div>

          {/* Switch Between Login and Register (Matching Reference Screenshot footer) */}
          <div className="text-center pt-2">
            <p className="text-xs text-gray-600">
              {isRegister ? 'Already have an account? ' : "Don't have an account? "}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError('');
                }}
                className="font-bold text-[#00c9a7] hover:underline underline-offset-2 transition"
              >
                {isRegister ? 'Sign in to portal' : 'Register your kitchen or shelter'}
              </button>
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
