import os
import sys
import json
import joblib
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.connection import get_db
from ml.preprocessor import MLDataPreprocessor

SAVED_MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "saved_models")

class MLPredictorService:
    def __init__(self):
        self.preprocessor = None
        self.lr_reg = None
        self.rf_reg = None
        self.log_clf = None
        self.dt_clf = None
        self.rf_clf = None
        self.metrics_summary = None
        self._ensure_loaded()

    def _ensure_loaded(self):
        """Loads models from disk or triggers in-process training if missing."""
        prep_path = os.path.join(SAVED_MODELS_DIR, "preprocessor.joblib")
        if not os.path.exists(prep_path):
            from ml.model_trainer import train_and_evaluate_all_models
            train_and_evaluate_all_models()

        self.preprocessor = MLDataPreprocessor.load(prep_path)
        self.lr_reg = joblib.load(os.path.join(SAVED_MODELS_DIR, "linear_regression.joblib"))
        self.rf_reg = joblib.load(os.path.join(SAVED_MODELS_DIR, "random_forest_regressor.joblib"))
        self.log_clf = joblib.load(os.path.join(SAVED_MODELS_DIR, "logistic_regression.joblib"))
        self.dt_clf = joblib.load(os.path.join(SAVED_MODELS_DIR, "decision_tree_classifier.joblib"))
        self.rf_clf = joblib.load(os.path.join(SAVED_MODELS_DIR, "random_forest_classifier.joblib"))

        summary_path = os.path.join(SAVED_MODELS_DIR, "metrics_summary.json")
        if os.path.exists(summary_path):
            with open(summary_path, "r") as f:
                self.metrics_summary = json.load(f)

    def predict_claim(self, payload):
        """
        Runs Classification inference for claim success and spoilage risk.
        Evaluates with Logistic Regression, Decision Tree, and Random Forest.
        """
        self._ensure_loaded()
        X_input = self.preprocessor.transform_single_payload(payload)

        # Probabilities & Predictions
        log_prob = float(self.log_clf.predict_proba(X_input)[0][1])
        dt_prob = float(self.dt_clf.predict_proba(X_input)[0][1])
        rf_prob = float(self.rf_clf.predict_proba(X_input)[0][1])

        ensemble_prob = (log_prob * 0.25) + (dt_prob * 0.25) + (rf_prob * 0.50)
        claim_success = bool(ensemble_prob >= 0.50)

        if ensemble_prob >= 0.70:
            risk_level = "Low Risk (High Rescue Probability)"
            action = "Batch is safe with ample shelf-life; standard dispatch queue."
        elif ensemble_prob >= 0.40:
            risk_level = "Moderate Urgency"
            action = "Notify nearby volunteer couriers within 5km radius."
        else:
            risk_level = "High Spoilage Risk / Critical Urgency"
            action = "Immediate express pickup required to prevent food waste."

        return {
            "prediction": {
                "claimSuccess": claim_success,
                "confidenceScore": round(ensemble_prob * 100, 1),
                "riskLevel": risk_level,
                "recommendedAction": action
            },
            "modelPredictions": {
                "logisticRegression": {
                    "probability": round(log_prob * 100, 1),
                    "prediction": bool(log_prob >= 0.5)
                },
                "decisionTree": {
                    "probability": round(dt_prob * 100, 1),
                    "prediction": bool(dt_prob >= 0.5)
                },
                "randomForest": {
                    "probability": round(rf_prob * 100, 1),
                    "prediction": bool(rf_prob >= 0.5)
                }
            },
            "inputPayload": payload
        }

    def predict_turnaround(self, payload):
        """
        Runs Regression inference for delivery and transit turnaround duration.
        Evaluates with Linear Regression and Random Forest Regressor.
        """
        self._ensure_loaded()
        X_input = self.preprocessor.transform_single_payload(payload)

        lr_time = float(self.lr_reg.predict(X_input)[0])
        rf_time = float(self.rf_reg.predict(X_input)[0])

        ensemble_time = round((lr_time * 0.35) + (rf_time * 0.65), 1)
        ensemble_time = max(10.0, ensemble_time)

        # MAE error bounds
        mae_bound = 5.0
        if self.metrics_summary and "regression" in self.metrics_summary:
            mae_bound = self.metrics_summary["regression"]["random_forest_regressor"].get("mae", 5.0)

        return {
            "prediction": {
                "estimatedDeliveryTimeMinutes": ensemble_time,
                "confidenceIntervalMinutes": [
                    max(10.0, round(ensemble_time - mae_bound, 1)),
                    round(ensemble_time + mae_bound, 1)
                ],
                "transitCategory": "Fast (< 30 min)" if ensemble_time < 30 else ("Standard (30-60 min)" if ensemble_time <= 60 else "Extended (> 60 min)")
            },
            "modelPredictions": {
                "linearRegression": round(lr_time, 1),
                "randomForestRegressor": round(rf_time, 1)
            },
            "inputPayload": payload
        }

    def get_metrics(self):
        """
        Returns full evaluation metrics table from MongoDB or disk cache.
        """
        try:
            db = get_db()
            latest = db["ml_model_metrics"].find_one(sort=[("createdAt", -1)])
            if latest:
                latest.pop("_id", None)
                if "createdAt" in latest:
                    latest["createdAt"] = latest["createdAt"].isoformat()
                return latest
        except Exception:
            pass

        self._ensure_loaded()
        return self.metrics_summary

# Singleton instance
predictor_service = MLPredictorService()
