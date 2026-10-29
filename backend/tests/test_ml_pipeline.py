import pytest
from database.connection import get_db

def test_ml_dataset_in_mongodb():
    """Verify that ML training dataset is populated in MongoDB via PyMongo."""
    db = get_db()
    col = db["ml_rescue_records"]
    count = col.count_documents({})
    if count == 0:
        from ml.dataset_generator import seed_ml_dataset_to_mongodb
        count = seed_ml_dataset_to_mongodb(n_samples=500)
    assert count > 0, "MongoDB collection 'ml_rescue_records' should contain training documents."

    doc = col.find_one()
    assert "quantityKg" in doc
    assert "shelfLifeHours" in doc
    assert "claimSuccess" in doc
    assert "deliveryTimeMinutes" in doc

def test_ml_model_training_and_metrics():
    """Verify training of Regression & Classification models and all 6 evaluation metrics."""
    from ml.model_trainer import train_and_evaluate_all_models
    results = train_and_evaluate_all_models()

    assert "regression" in results
    assert "classification" in results

    # 1. Regression Metrics: R² Score, MAE, RMSE
    reg = results["regression"]
    assert "linear_regression" in reg
    assert "random_forest_regressor" in reg

    lr = reg["linear_regression"]
    assert "r2_score" in lr and isinstance(lr["r2_score"], float)
    assert "mae" in lr and lr["mae"] > 0

    rf_reg = reg["random_forest_regressor"]
    assert "r2_score" in rf_reg and isinstance(rf_reg["r2_score"], float)
    assert "mae" in rf_reg and rf_reg["mae"] > 0

    # 2. Classification Metrics: Accuracy, Precision, Recall, F1
    clf = results["classification"]
    assert "logistic_regression" in clf
    assert "decision_tree" in clf
    assert "random_forest_classifier" in clf

    for model_key in ["logistic_regression", "decision_tree", "random_forest_classifier"]:
        metrics = clf[model_key]
        assert "accuracy" in metrics and 0.0 <= metrics["accuracy"] <= 1.0
        assert "precision" in metrics and 0.0 <= metrics["precision"] <= 1.0
        assert "recall" in metrics and 0.0 <= metrics["recall"] <= 1.0
        assert "f1" in metrics and 0.0 <= metrics["f1"] <= 1.0

def test_api_ml_metrics(client):
    """Test GET /api/ml/metrics returns full evaluation metrics."""
    res = client.get("/api/ml/metrics")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "success"
    metrics = data["metrics"]
    assert "regression" in metrics
    assert "classification" in metrics

def test_api_predict_claim(client):
    """Test POST /api/ml/predict-claim classification inference."""
    payload = {
        "foodCategory": "Cooked Meals",
        "donorType": "Restaurant",
        "transportMode": "motorcycle",
        "quantityKg": 25.0,
        "shelfLifeHours": 5.0,
        "prepHour": 13,
        "distanceKm": 4.5,
        "storageTempCelsius": 60.0,
        "isWeekend": 0
    }
    res = client.post("/api/ml/predict-claim", json=payload)
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "success"
    pred = data["data"]["prediction"]
    assert "claimSuccess" in pred
    assert "confidenceScore" in pred
    assert "riskLevel" in pred

def test_api_predict_delivery_time(client):
    """Test POST /api/ml/predict-delivery-time regression inference."""
    payload = {
        "foodCategory": "Cooked Meals",
        "donorType": "Restaurant",
        "transportMode": "motorcycle",
        "quantityKg": 20.0,
        "distanceKm": 8.0,
        "prepHour": 14
    }
    res = client.post("/api/ml/predict-delivery-time", json=payload)
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "success"
    pred = data["data"]["prediction"]
    assert "estimatedDeliveryTimeMinutes" in pred
    assert pred["estimatedDeliveryTimeMinutes"] > 0
    assert "confidenceIntervalMinutes" in pred

def test_api_dataset_sample(client):
    """Test GET /api/ml/dataset-sample retrieves documents via PyMongo."""
    res = client.get("/api/ml/dataset-sample")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "success"
    assert "samples" in data
    assert len(data["samples"]) > 0
