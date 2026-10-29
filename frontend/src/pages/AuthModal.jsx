import React from 'react';
import AuthPage from './AuthPage';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', defaultRole = 'donor' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white sm:rounded-3xl shadow-2xl max-w-6xl w-full overflow-hidden border border-gray-200 relative min-h-screen sm:min-h-[680px] max-h-none sm:max-h-[92vh] flex flex-col">
        <AuthPage
          initialMode={initialMode}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
