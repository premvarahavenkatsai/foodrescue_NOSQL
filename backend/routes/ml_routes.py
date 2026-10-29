from flask import Blueprint, request, jsonify
from ml.predictor import predictor_service
from ml.model_trainer import train_and_evaluate_all_models
from database.connection import get_db, serialize_doc

ml_bp = Blueprint("ml", __name__)

@ml_bp.route("/metrics", methods=["GET"])
def get_metrics():
    """
    Returns full evaluation metrics table for all models:
    - Regression (Linear Regression, Random Forest): R² Score, MAE, RMSE
    - Classification (Logistic Regression, Decision Tree, Random Forest): Accuracy, Precision, Recall, F1
    """
    try:
        metrics = predictor_service.get_metrics()
        return jsonify({
            "status": "success",
            "metrics": metrics
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@ml_bp.route("/predict-claim", methods=["POST"])
def predict_claim():
    """
    Evaluates donation claim probability and spoilage risk using:
    - Logistic Regression
    - Decision Tree Classifier
    - Random Forest Classifier
    """
    try:
        payload = request.get_json() or {}
        result = predictor_service.predict_claim(payload)
        return jsonify({
            "status": "success",
            "data": result
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@ml_bp.route("/predict-delivery-time", methods=["POST"])
def predict_delivery_time():
    """
    Predicts expected delivery & transit duration using:
    - Linear Regression
    - Random Forest Regressor
    """
    try:
        payload = request.get_json() or {}
        result = predictor_service.predict_turnaround(payload)
        return jsonify({
            "status": "success",
            "data": result
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@ml_bp.route("/retrain", methods=["POST"])
def retrain_models():
    """
    Triggers complete PyMongo-driven retraining pipeline on MongoDB records.
    """
    try:
        updated_metrics = train_and_evaluate_all_models()
        predictor_service._ensure_loaded()
        return jsonify({
            "status": "success",
            "message": "Models successfully retrained from MongoDB data.",
            "metrics": updated_metrics
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@ml_bp.route("/dataset-sample", methods=["GET"])
def dataset_sample():
    """
    Fetches sample documents from MongoDB collection 'ml_rescue_records' via PyMongo.
    """
    try:
        db = get_db()
        col = db["ml_rescue_records"]
        count = col.count_documents({})
        samples = list(col.find().limit(10))
        return jsonify({
            "status": "success",
            "totalCount": count,
            "samples": serialize_doc(samples)
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
