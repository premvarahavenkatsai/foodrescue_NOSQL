import React from 'react';
import { Database, ShieldAlert, Sparkles, Layers } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-warm-900 text-warm-300 border-t border-warm-800 mt-20 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 text-white font-bold text-lg mb-3">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                <Database className="w-4 h-4 text-white" />
              </div>
              <span>FoodRescue Platform</span>
            </div>
            <p className="text-sm text-warm-400 mb-4 max-w-md">
              A decentralized food rescue ecosystem linking commercial food donors, certified volunteer couriers, and verified community shelters to eliminate urban food waste.
            </p>
            <div className="flex items-center space-x-2 text-xs text-brand-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>MongoDB 8.0 Engine • PyMongo 4.x Driver • $jsonSchema Active</span>
            </div>
          </div>

          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">
              Academic Context
            </h4>
            <ul className="space-y-2 text-xs text-warm-400">
              <li>Course: CSE494 Intelligent NoSQL</li>
              <li>Degree: B.Tech Computer Science</li>
              <li>Architecture: MongoDB Document Store</li>
              <li>Validation: Server & DB $jsonSchema</li>
              <li>Aggregation: 6+ Multi-stage Pipelines</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">
              Food Safety & Compliance
            </h4>
            <div className="bg-warm-800/80 p-3 rounded-lg border border-warm-700/60 text-[11px] text-warm-300 space-y-1.5">
              <div className="flex items-center space-x-1.5 text-amber-400 font-semibold">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Notice</span>
              </div>
              <p>
                Platform monitors temperature tags and strict collection expiry windows in accordance with FSSAI surplus food guidelines. Donations require verified recipient inspection at handoff.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-warm-800 flex flex-col sm:flex-row justify-between items-center text-xs text-warm-500">
          <p>© 2026 FoodRescue Academic Project. Designed for Intelligent NoSQL Databases.</p>
          <p className="mt-2 sm:mt-0 font-mono text-[11px]">Database: foodrescue_db</p>
        </div>
      </div>
    </footer>
  );
}
