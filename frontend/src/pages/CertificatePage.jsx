import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Printer, ArrowLeft, ShieldCheck, Award, HeartHandshake, CheckCircle2 } from 'lucide-react';

export default function CertificatePage({ setCurrentView }) {
  const { user } = useAuth();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCert() {
      if (!user) return;
      try {
        const res = await api.getCertificate(user.id || user._id);
        setCert(res.certificate);
      } catch (err) {
        setError(err.message || 'Failed to verify certificate eligibility');
      } finally {
        setLoading(false);
      }
    }
    loadCert();
  }, [user]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Controls (Hidden when printing) */}
      <div className="flex justify-between items-center no-print">
        <button
          onClick={() => setCurrentView('volunteer-dashboard')}
          className="flex items-center space-x-1 text-xs font-semibold text-warm-600 hover:text-warm-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        {cert && (
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-600/30 transition flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-warm-500">
          Verifying delivery records from MongoDB...
        </div>
      ) : error ? (
        <div className="bg-white p-8 rounded-2xl border border-rose-200 text-center space-y-3">
          <ShieldCheck className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-warm-900">Certificate Ineligible</h3>
          <p className="text-xs text-warm-500 max-w-md mx-auto">{error}</p>
          <button
            onClick={() => setCurrentView('volunteer-dashboard')}
            className="px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-lg mt-2"
          >
            Go to Volunteer Dashboard
          </button>
        </div>
      ) : (
        /* Printable Certificate Container */
        <div
          id="printable-certificate"
          className="bg-white rounded-3xl border-8 border-double border-amber-600/40 p-10 sm:p-14 shadow-2xl relative overflow-hidden text-center space-y-8"
        >
          {/* Subtle Background Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
            <HeartHandshake className="w-96 h-96 text-warm-900" />
          </div>

          {/* Certificate Header */}
          <div className="space-y-3 relative">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Award className="w-9 h-9" />
            </div>

            <div className="text-xs uppercase font-extrabold tracking-[0.25em] text-brand-700">
              National FoodRescue India Initiative
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-warm-900 tracking-tight font-serif">
              Certificate of Commendation
            </h1>

            <p className="text-xs text-warm-500 uppercase tracking-widest font-medium">
              Verified Food Rescue Courier Service
            </p>
          </div>

          {/* Recipient Details */}
          <div className="space-y-2 relative">
            <p className="text-xs italic text-warm-500">This official certificate is proudly conferred upon</p>
            <div className="text-2xl sm:text-3xl font-extrabold text-brand-800 underline decoration-amber-400 decoration-2 underline-offset-8">
              {cert.volunteerName}
            </div>
            <p className="text-xs text-warm-600 pt-3 max-w-xl mx-auto leading-relaxed">
              In recognition of exceptional dedication, compassion, and verified community service in rescuing surplus food from commercial dining facilities and delivering safe meals to community shelters.
            </p>
          </div>

          {/* Verified Rescue Metrics Box */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto bg-warm-50/80 p-4 rounded-2xl border border-warm-200/80 relative">
            <div>
              <div className="text-xl font-black text-warm-900">{cert.totalFoodDeliveredKg} kg</div>
              <div className="text-[10px] text-warm-500 uppercase font-semibold">Rescued Food</div>
            </div>
            <div>
              <div className="text-xl font-black text-warm-900">{cert.totalDeliveries}</div>
              <div className="text-[10px] text-warm-500 uppercase font-semibold">Completed Missions</div>
            </div>
            <div>
              <div className="text-xl font-black text-warm-900">{cert.estimatedServiceHours} hrs</div>
              <div className="text-[10px] text-warm-500 uppercase font-semibold">Service Hours</div>
            </div>
          </div>

          {/* Footer & Signatures */}
          <div className="pt-8 border-t border-warm-200 flex justify-between items-end text-left relative text-xs">
            <div>
              <div className="font-mono text-[10px] text-warm-400">Certificate ID: {cert.certificateId}</div>
              <div className="text-warm-600 mt-1">Date Issued: <strong className="text-warm-800">{cert.issueDate}</strong></div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cryptographically Verified Database Record</span>
              </div>
            </div>

            <div className="text-right">
              <div className="font-serif italic text-base text-warm-800 font-bold border-b border-warm-300 pb-1">
                Prof. / Examiner Signature
              </div>
              <div className="text-[10px] uppercase tracking-wider text-warm-500 font-semibold mt-1">
                CSE494 Intelligent NoSQL Databases
              </div>
              <div className="text-[9px] text-warm-400">Department of Computer Science & Engineering</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
