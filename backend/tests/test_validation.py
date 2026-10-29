import pytest
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from pymongo.errors import WriteError, OperationFailure
from database.connection import get_donations_col, get_users_col

def test_mongodb_json_schema_rejects_negative_quantity():
    """Proves MongoDB strict $jsonSchema rejects quantityKg <= 0"""
    donations_col = get_donations_col()
    now = datetime.now(timezone.utc)

    invalid_doc = {
        "donorId": ObjectId(),
        "foodName": "Invalid Negative Batch",
        "category": "Cooked Meals",
        "quantityKg": -10.0,  # Negative quantity violates minimum: 0.1 schema
        "preparedAt": now,
        "availableUntil": now + timedelta(hours=4),
        "pickupAddress": "123 Test St",
        "dietaryInfo": ["Vegetarian"],
        "status": "available",
        "createdAt": now,
        "updatedAt": now
    }

    with pytest.raises((WriteError, OperationFailure)) as exc_info:
        donations_col.insert_one(invalid_doc)
    assert "Document failed validation" in str(exc_info.value)

def test_mongodb_json_schema_rejects_invalid_status_enum():
    """Proves MongoDB strict $jsonSchema rejects invalid status value"""
    donations_col = get_donations_col()
    now = datetime.now(timezone.utc)

    invalid_doc = {
        "donorId": ObjectId(),
        "foodName": "Invalid Status Batch",
        "category": "Cooked Meals",
        "quantityKg": 5.0,
        "preparedAt": now,
        "availableUntil": now + timedelta(hours=4),
        "pickupAddress": "123 Test St",
        "dietaryInfo": [],
        "status": "not_a_valid_status_value",  # Violates enum
        "createdAt": now,
        "updatedAt": now
    }

    with pytest.raises((WriteError, OperationFailure)) as exc_info:
        donations_col.insert_one(invalid_doc)
    assert "Document failed validation" in str(exc_info.value)

def test_api_validation_rejects_missing_fields(client, auth_tokens):
    """Proves Flask API layer rejects donation payload missing required fields"""
    res = client.post(
        "/api/donations",
        json={"foodName": "Incomplete Item"},
        headers={"Authorization": f"Bearer {auth_tokens['donor']}"}
    )
    assert res.status_code == 400
    data = res.get_json()
    assert "Validation failed" in data.get("error", "")

def test_api_validation_rejects_zero_or_negative_quantity(client, auth_tokens):
    """Proves Flask API layer rejects zero or negative quantity"""
    now = datetime.now(timezone.utc)
    payload = {
        "foodName": "Zero Quantity Soup",
        "category": "Cooked Meals",
        "quantityKg": 0,
        "availableUntil": (now + timedelta(hours=4)).isoformat(),
        "pickupAddress": "Test Kitchen 1"
    }
    res = client.post(
        "/api/donations",
        json=payload,
        headers={"Authorization": f"Bearer {auth_tokens['donor']}"}
    )
    assert res.status_code == 400
    data = res.get_json()
    assert any("strictly greater than 0" in err for err in data.get("details", []))

def test_api_validation_rejects_invalid_category(client, auth_tokens):
    """Proves Flask API layer rejects unapproved food category"""
    now = datetime.now(timezone.utc)
    payload = {
        "foodName": "Forbidden Category Food",
        "category": "FastFoodJunk",
        "quantityKg": 10.0,
        "availableUntil": (now + timedelta(hours=4)).isoformat(),
        "pickupAddress": "Test Kitchen 1"
    }
    res = client.post(
        "/api/donations",
        json=payload,
        headers={"Authorization": f"Bearer {auth_tokens['donor']}"}
    )
    assert res.status_code == 400
    data = res.get_json()
    assert any("Invalid category" in err for err in data.get("details", []))
