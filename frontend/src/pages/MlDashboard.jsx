import React, { useState, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  Target,
  Sparkles,
  RefreshCw,
  Clock,
  Scale,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  BarChart3,
  Sliders,
  Layers
} from 'lucide-react';

const API_BASE = 'http://localhost:5055/api';

export default function MlDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [message, setMessage] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    foodCategory: 'Cooked Meals',
    donorType: 'Restaurant',
    transportMode: 'motorcycle',
    quantityKg: 25,
    shelfLifeHours: 5,
    distanceKm: 6.5,
    prepHour: 13,
    storageTempCelsius: 60,
    isWeekend: 0
  });

  const [claimPrediction, setClaimPrediction] = useState(null);
  const [deliveryPrediction, setDeliveryPrediction] = useState(null);
  const [predictingClaim, setPredictingClaim] = useState(false);
  const [predictingTime, setPredictingTime] = useState(false);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/ml/metrics`);
      const data = await res.json();
      if (data.status === 'success') {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Error fetching ML metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleRetrain = async () => {
    try {
      setRetraining(true);
      setMessage('Retraining models from MongoDB records via PyMongo...');
      const res = await fetch(`${API_BASE}/ml/retrain`, { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success') {
        setMetrics(data.metrics);
        setMessage('Retraining completed successfully! Metrics updated.');
      } else {
        setMessage('Retraining failed: ' + data.message);
      }
    } catch (err) {
      setMessage('Network error during retraining.');
    } finally {
      setRetraining(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handlePredictClaim = async (e) => {
    e.preventDefault();
    try {
      setPredictingClaim(true);
      const res = await fetch(`${API_BASE}/ml/predict-claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.status === 'success') {
        setClaimPrediction(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPredictingClaim(false);
    }
  };

  const handlePredictDelivery = async () => {
    try {
      setPredictingTime(true);
      const res = await fetch(`${API_BASE}/ml/predict-delivery-time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.status === 'success') {
        setDeliveryPrediction(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPredictingTime(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-warm-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-200 text-xs font-semibold">
              <Brain className="w-4 h-4 text-brand-300" />
              Machine Learning & PyMongo Intelligence
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Predictive Food Rescue Optimization
            </h1>
            <p className="text-sm text-brand-100/80 max-w-2xl leading-relaxed">
              Dual-task ML engine powered by MongoDB dataset integration. Features both
              <strong> Regression</strong> (Linear Regression & Random Forest) and
              <strong> Classification</strong> (Logistic Regression, Decision Tree, Random Forest)
              with all 6 evaluation metrics: Accuracy, R², MAE, Precision, Recall, and F1.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleRetrain}
              disabled={retraining}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-brand-900 font-bold text-xs shadow-lg hover:bg-brand-50 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${retraining ? 'animate-spin' : ''}`} />
              {retraining ? 'Retraining...' : 'Retrain via PyMongo'}
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200 text-brand-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-brand-600" />
          {message}
        </div>
      )}

      {/* METRICS EVALUATION SECTION */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-warm-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-600" />
            Model Evaluation Metrics (Academic Rubric)
          </h2>
          <span className="text-xs text-warm-500">
            Source: <code className="bg-warm-100 px-2 py-0.5 rounded text-warm-700">foodrescue_db.ml_model_metrics</code>
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-warm-400 text-sm">Loading ML metrics...</div>
        ) : metrics ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. REGRESSION MODELS CARD */}
            <div className="bg-white rounded-3xl p-6 border border-warm-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-warm-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-warm-900 text-base">Regression Models</h3>
                    <p className="text-xs text-warm-500">Target: Delivery Duration (Minutes)</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                  R² Score & MAE
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-warm-100 text-warm-400 font-semibold uppercase">
                      <th className="py-2.5">Model</th>
                      <th className="py-2.5 text-center">R² Score</th>
                      <th className="py-2.5 text-center">MAE (min)</th>
                      <th className="py-2.5 text-center">RMSE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-50">
                    {Object.entries(metrics.regression || {}).map(([key, item]) => (
                      <tr key={key} className="hover:bg-warm-50/50">
                        <td className="py-3 font-semibold text-warm-900">{item.modelName}</td>
                        <td className="py-3 text-center">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold">
                            {item.r2_score}
                          </span>
                        </td>
                        <td className="py-3 text-center font-semibold text-warm-700">{item.mae}</td>
                        <td className="py-3 text-center text-warm-500">{item.rmse}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-warm-500 italic">
                * Evaluated on an independent 20% test holdout partition.
              </p>
            </div>

            {/* 2. CLASSIFICATION MODELS CARD */}
            <div className="bg-white rounded-3xl p-6 border border-warm-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-warm-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-brand-50 text-brand-700">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-warm-900 text-base">Classification Models</h3>
                    <p className="text-xs text-warm-500">Target: Claim Success / Freshness</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-[11px] font-bold">
                  Acc, Prec, Rec, F1
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-warm-100 text-warm-400 font-semibold uppercase">
                      <th className="py-2.5">Model</th>
                      <th className="py-2.5 text-center">Accuracy</th>
                      <th className="py-2.5 text-center">Precision</th>
                      <th className="py-2.5 text-center">Recall</th>
                      <th className="py-2.5 text-center">F1-Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-50">
                    {Object.entries(metrics.classification || {}).map(([key, item]) => (
                      <tr key={key} className="hover:bg-warm-50/50">
                        <td className="py-3 font-semibold text-warm-900">{item.modelName}</td>
                        <td className="py-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-bold">
                            {(item.accuracy * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 text-center font-medium text-warm-700">{item.precision}</td>
                        <td className="py-3 text-center font-medium text-warm-700">{item.recall}</td>
                        <td className="py-3 text-center font-bold text-brand-600">{item.f1}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-warm-500 italic">
                * Stratified split to preserve class balance between claimed and expired food batches.
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* INTERACTIVE PREDICTION PLAYGROUND */}
      <div className="bg-white rounded-3xl p-8 border border-warm-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-warm-100">
          <div>
            <h2 className="text-xl font-bold text-warm-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-brand-600" />
              Live Inference Simulator (Real-Time Scikit-Learn Prediction)
            </h2>
            <p className="text-xs text-warm-500 mt-1">
              Adjust parameters below to test real-time classification and regression predictions.
            </p>
          </div>
        </div>

        <form onSubmit={handlePredictClaim} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-warm-700 mb-1.5">Food Category</label>
            <select
              value={formData.foodCategory}
              onChange={(e) => setFormData({ ...formData, foodCategory: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-warm-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="Cooked Meals">Cooked Meals</option>
              <option value="Bakery & Bread">Bakery & Bread</option>
              <option value="Fresh Produce">Fresh Produce</option>
              <option value="Dairy Products">Dairy Products</option>
              <option value="Packaged Food">Packaged Food</option>
              <option value="Beverages">Beverages</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-warm-700 mb-1.5">Donor Commercial Type</label>
            <select
              value={formData.donorType}
              onChange={(e) => setFormData({ ...formData, donorType: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-warm-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="Restaurant">Restaurant</option>
              <option value="Supermarket">Supermarket</option>
              <option value="Catering Service">Catering Service</option>
              <option value="Hotel & Banquet">Hotel & Banquet</option>
              <option value="University Dining">University Dining</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-warm-700 mb-1.5">Courier Transport Mode</label>
            <select
              value={formData.transportMode}
              onChange={(e) => setFormData({ ...formData, transportMode: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-warm-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="motorcycle">Motorcycle</option>
              <option value="car">Car</option>
              <option value="van">Van</option>
              <option value="bicycle">Bicycle</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-warm-700 mb-1.5">
              Batch Quantity: <span className="text-brand-600 font-bold">{formData.quantityKg} kg</span>
            </label>
            <input
              type="range"
              min="2"
              max="120"
              value={formData.quantityKg}
              onChange={(e) => setFormData({ ...formData, quantityKg: Number(e.target.value) })}
              className="w-full accent-brand-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-warm-700 mb-1.5">
              Shelf-Life Remaining: <span className="text-brand-600 font-bold">{formData.shelfLifeHours} hrs</span>
            </label>
            <input
              type="range"
              min="1"
              max="72"
              value={formData.shelfLifeHours}
              onChange={(e) => setFormData({ ...formData, shelfLifeHours: Number(e.target.value) })}
              className="w-full accent-brand-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-warm-700 mb-1.5">
              Transit Distance: <span className="text-brand-600 font-bold">{formData.distanceKm} km</span>
            </label>
            <input
              type="range"
              min="1"
              max="30"
              step="0.5"
              value={formData.distanceKm}
              onChange={(e) => setFormData({ ...formData, distanceKm: Number(e.target.value) })}
              className="w-full accent-brand-600"
            />
          </div>

          <div className="md:col-span-3 flex flex-wrap gap-4 pt-2">
            <button
              type="submit"
              disabled={predictingClaim}
              className="px-6 py-3 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-md hover:bg-brand-700 transition-all flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              {predictingClaim ? 'Running Classifiers...' : 'Predict Claim Success & Spoilage Risk'}
            </button>

            <button
              type="button"
              onClick={handlePredictDelivery}
              disabled={predictingTime}
              className="px-6 py-3 rounded-xl bg-warm-900 text-white font-bold text-xs shadow-md hover:bg-warm-800 transition-all flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              {predictingTime ? 'Running Regressors...' : 'Predict Delivery Turnaround Time'}
            </button>
          </div>
        </form>

        {/* RESULTS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {claimPrediction && (
            <div className="p-6 rounded-2xl bg-brand-50/60 border border-brand-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-900 uppercase tracking-wide">
                  Classification Outcome
                </span>
                <span className="px-3 py-1 rounded-full bg-brand-600 text-white text-xs font-extrabold">
                  {claimPrediction.prediction.confidenceScore}% Rescue Probability
                </span>
              </div>
              <div>
                <h4 className="text-base font-bold text-warm-900">
                  {claimPrediction.prediction.riskLevel}
                </h4>
                <p className="text-xs text-warm-600 mt-1">
                  {claimPrediction.prediction.recommendedAction}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-brand-200/50 text-[11px]">
                <div className="text-center p-2 rounded-xl bg-white border border-brand-100">
                  <span className="text-warm-400 block">Logistic Reg</span>
                  <span className="font-bold text-warm-800">
                    {claimPrediction.modelPredictions.logisticRegression.probability}%
                  </span>
                </div>
                <div className="text-center p-2 rounded-xl bg-white border border-brand-100">
                  <span className="text-warm-400 block">Decision Tree</span>
                  <span className="font-bold text-warm-800">
                    {claimPrediction.modelPredictions.decisionTree.probability}%
                  </span>
                </div>
                <div className="text-center p-2 rounded-xl bg-white border border-brand-100">
                  <span className="text-warm-400 block">Random Forest</span>
                  <span className="font-bold text-warm-800">
                    {claimPrediction.modelPredictions.randomForest.probability}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {deliveryPrediction && (
            <div className="p-6 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  Regression Turnaround Outcome
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-600 text-white text-xs font-extrabold">
                  {deliveryPrediction.prediction.transitCategory}
                </span>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-amber-950">
                  {deliveryPrediction.prediction.estimatedDeliveryTimeMinutes} <span className="text-sm font-normal text-amber-800">minutes</span>
                </div>
                <p className="text-xs text-amber-800/80 mt-1">
                  Confidence Interval (MAE bounded):{' '}
                  <strong>{deliveryPrediction.prediction.confidenceIntervalMinutes[0]} - {deliveryPrediction.prediction.confidenceIntervalMinutes[1]} mins</strong>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200/50 text-[11px]">
                <div className="text-center p-2 rounded-xl bg-white border border-amber-100">
                  <span className="text-warm-400 block">Linear Regression</span>
                  <span className="font-bold text-warm-800">
                    {deliveryPrediction.modelPredictions.linearRegression} mins
                  </span>
                </div>
                <div className="text-center p-2 rounded-xl bg-white border border-amber-100">
                  <span className="text-warm-400 block">Random Forest Regressor</span>
                  <span className="font-bold text-warm-800">
                    {deliveryPrediction.modelPredictions.randomForestRegressor} mins
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
