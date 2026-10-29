import os
import sys
import json
from datetime import datetime, timezone
import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.metrics import (
    r2_score,
    mean_absolute_error,
    mean_squared_error,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix
)

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.connection import get_db
from ml.preprocessor import MLDataPreprocessor

SAVED_MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "saved_models")

def train_and_evaluate_all_models():
    """
    Complete ML Pipeline:
    1. Extracts data from MongoDB via PyMongo
    2. Preprocesses and scales features
    3. Trains Linear Regression, Random Forest Regressor (R², MAE)
    4. Trains Logistic Regression, Decision Tree, Random Forest Classifier (Accuracy, Precision, Recall, F1)
    5. Saves model weights to disk
    6. Persists detailed evaluation metrics directly into MongoDB 'ml_model_metrics'
    """
    os.makedirs(SAVED_MODELS_DIR, exist_ok=True)
    print("[INFO] Initializing PyMongo data extraction and ML preprocessing...")

    preprocessor = MLDataPreprocessor()
    df = preprocessor.load_data_from_mongodb()
    total_records = len(df)
    print(f"[DATA] Loaded {total_records} records from MongoDB.")

    X, y_clf, y_reg, _ = preprocessor.fit_transform(df)

    # 80/20 train/test split
    X_train_c, X_test_c, y_train_c, y_test_c = train_test_split(
        X, y_clf, test_size=0.20, random_state=42, stratify=y_clf
    )
    X_train_r, X_test_r, y_train_r, y_test_r = train_test_split(
        X, y_reg, test_size=0.20, random_state=42
    )

    results = {
        "metadata": {
            "trainedAt": datetime.now(timezone.utc).isoformat(),
            "totalRecords": total_records,
            "trainSamples": len(X_train_c),
            "testSamples": len(X_test_c),
            "featuresCount": len(preprocessor.feature_names),
            "featureNames": preprocessor.feature_names,
            "mongoDatabase": "foodrescue_db",
            "mongoSourceCollection": "ml_rescue_records"
        },
        "regression": {},
        "classification": {}
    }

    # =========================================================================
    # 1. REGRESSION MODELS (Evaluation: R² Score, MAE, RMSE)
    # =========================================================================
    print("[TRAIN] Training Regression Models for Rescue Turnaround & Delivery Duration...")

    # A) Linear Regression
    lr = LinearRegression()
    lr.fit(X_train_r, y_train_r)
    lr_pred = lr.predict(X_test_r)

    lr_r2 = float(r2_score(y_test_r, lr_pred))
    lr_mae = float(mean_absolute_error(y_test_r, lr_pred))
    lr_rmse = float(np.sqrt(mean_squared_error(y_test_r, lr_pred)))

    results["regression"]["linear_regression"] = {
        "modelName": "Linear Regression",
        "type": "Regression",
        "target": "deliveryTimeMinutes",
        "r2_score": round(lr_r2, 4),
        "mae": round(lr_mae, 4),
        "rmse": round(lr_rmse, 4),
        "description": "Standard linear estimator modeling delivery duration based on distance, quantity, and prep hour."
    }
    joblib.dump(lr, os.path.join(SAVED_MODELS_DIR, "linear_regression.joblib"))

    # B) Random Forest Regressor
    rf_reg = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
    rf_reg.fit(X_train_r, y_train_r)
    rf_pred = rf_reg.predict(X_test_r)

    rf_r2 = float(r2_score(y_test_r, rf_pred))
    rf_mae = float(mean_absolute_error(y_test_r, rf_pred))
    rf_rmse = float(np.sqrt(mean_squared_error(y_test_r, rf_pred)))

    results["regression"]["random_forest_regressor"] = {
        "modelName": "Random Forest Regressor",
        "type": "Regression",
        "target": "deliveryTimeMinutes",
        "r2_score": round(rf_r2, 4),
        "mae": round(rf_mae, 4),
        "rmse": round(rf_rmse, 4),
        "description": "Non-linear ensemble capturing complex interactions between distance, transport modes, and traffic windows."
    }
    joblib.dump(rf_reg, os.path.join(SAVED_MODELS_DIR, "random_forest_regressor.joblib"))

    # =========================================================================
    # 2. CLASSIFICATION MODELS (Evaluation: Accuracy, Precision, Recall, F1)
    # =========================================================================
    print("[TRAIN] Training Classification Models for Claim Success / Spoilage Prevention...")

    # A) Logistic Regression
    log_reg = LogisticRegression(max_iter=1000, random_state=42)
    log_reg.fit(X_train_c, y_train_c)
    log_pred = log_reg.predict(X_test_c)

    results["classification"]["logistic_regression"] = {
        "modelName": "Logistic Regression",
        "type": "Classification",
        "target": "claimSuccess",
        "accuracy": round(float(accuracy_score(y_test_c, log_pred)), 4),
        "precision": round(float(precision_score(y_test_c, log_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test_c, log_pred, zero_division=0)), 4),
        "f1": round(float(f1_score(y_test_c, log_pred, zero_division=0)), 4),
        "confusion_matrix": confusion_matrix(y_test_c, log_pred).tolist(),
        "description": "Parametric linear probability model estimating likelihood of donation rescue before expiration."
    }
    joblib.dump(log_reg, os.path.join(SAVED_MODELS_DIR, "logistic_regression.joblib"))

    # B) Decision Tree Classifier
    dt = DecisionTreeClassifier(max_depth=5, min_samples_leaf=10, random_state=42)
    dt.fit(X_train_c, y_train_c)
    dt_pred = dt.predict(X_test_c)

    results["classification"]["decision_tree"] = {
        "modelName": "Decision Tree Classifier",
        "type": "Classification",
        "target": "claimSuccess",
        "accuracy": round(float(accuracy_score(y_test_c, dt_pred)), 4),
        "precision": round(float(precision_score(y_test_c, dt_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test_c, dt_pred, zero_division=0)), 4),
        "f1": round(float(f1_score(y_test_c, dt_pred, zero_division=0)), 4),
        "confusion_matrix": confusion_matrix(y_test_c, dt_pred).tolist(),
        "description": "Interpretable tree-based model partitioning feature space on critical shelf-life and distance thresholds."
    }
    joblib.dump(dt, os.path.join(SAVED_MODELS_DIR, "decision_tree_classifier.joblib"))

    # C) Random Forest Classifier
    rf_clf = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    rf_clf.fit(X_train_c, y_train_c)
    rf_c_pred = rf_clf.predict(X_test_c)

    results["classification"]["random_forest_classifier"] = {
        "modelName": "Random Forest Classifier",
        "type": "Classification",
        "target": "claimSuccess",
        "accuracy": round(float(accuracy_score(y_test_c, rf_c_pred)), 4),
        "precision": round(float(precision_score(y_test_c, rf_c_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test_c, rf_c_pred, zero_division=0)), 4),
        "f1": round(float(f1_score(y_test_c, rf_c_pred, zero_division=0)), 4),
        "confusion_matrix": confusion_matrix(y_test_c, rf_c_pred).tolist(),
        "description": "High-capacity ensemble reducing variance across multiple decision boundaries for robust claim prediction."
    }
    joblib.dump(rf_clf, os.path.join(SAVED_MODELS_DIR, "random_forest_classifier.joblib"))

    # Save preprocessor
    preprocessor.save(os.path.join(SAVED_MODELS_DIR, "preprocessor.joblib"))

    # Save summary to JSON
    with open(os.path.join(SAVED_MODELS_DIR, "metrics_summary.json"), "w") as f:
        json.dump(results, f, indent=2)

    # Persist metrics directly into MongoDB via PyMongo
    db = get_db()
    db["ml_model_metrics"].insert_one({
        **results,
        "createdAt": datetime.now(timezone.utc)
    })
    print("[SUCCESS] Evaluation metrics and trained models saved to disk and MongoDB collection 'ml_model_metrics'!")

    return results

if __name__ == "__main__":
    res = train_and_evaluate_all_models()
    print("\n=== MODEL EVALUATION RESULTS ===")
    print(json.dumps(res, indent=2))
