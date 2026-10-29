import pytest
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from database.connection import get_donations_col

def test_donor_creates_donation_successfully(client, auth_tokens):
    now = datetime.now(timezone.utc)
    payload = {
        "foodName": "Fresh Moong Dal & Jeera Rice",
        "category": "Cooked Meals",
        "quantityKg": 18.5,
        "availableUntil": (now + timedelta(hours=8)).isoformat(),
        "pickupAddress": "45, MG Road, Indiranagar, Bengaluru",
        "dietaryInfo": ["Pure Vegetarian", "Jain Friendly"],
        "description": "Hot dal and steamed rice stored in sealed stainless steel containers."
    }
    res = client.post(
        "/api/donations",
        json=payload,
        headers={"Authorization": f"Bearer {auth_tokens['donor']}"}
    )
    assert res.status_code == 201
    data = res.get_json()
    assert data["donation"]["foodName"] == "Fresh Moong Dal & Jeera Rice"
    assert data["donation"]["status"] == "available"
    assert data["donation"]["quantityKg"] == 18.5

def test_get_available_donations(client):
    res = client.get("/api/donations?status=available")
    assert res.status_code == 200
    data = res.get_json()
    assert "donations" in data
    assert data["count"] > 0

def test_update_donation_success_and_auth_check(client, auth_tokens):
    now = datetime.now(timezone.utc)
    create_res = client.post(
        "/api/donations",
        json={
            "foodName": "Initial Poha & Upma Batch",
            "category": "Cooked Meals",
            "quantityKg": 12.0,
            "availableUntil": (now + timedelta(hours=6)).isoformat(),
            "pickupAddress": "12, Banjara Hills, Hyderabad"
        },
        headers={"Authorization": f"Bearer {auth_tokens['donor']}"}
    )
    donation_id = create_res.get_json()["donation"]["id"]

    # 1. Unauthorized attempt: Volunteer tries to edit the donation -> 403 Forbidden
    vol_attempt = client.put(
        f"/api/donations/{donation_id}",
        json={"foodName": "Hacked Title"},
        headers={"Authorization": f"Bearer {auth_tokens['volunteer']}"}
    )
    assert vol_attempt.status_code == 403

    # 2. Authorized edit by donor
    donor_edit = client.put(
        f"/api/donations/{donation_id}",
        json={"foodName": "Updated Poha & Upma Breakfast Batch", "quantityKg": 14.5},
        headers={"Authorization": f"Bearer {auth_tokens['donor']}"}
    )
    assert donor_edit.status_code == 200
    assert donor_edit.get_json()["donation"]["foodName"] == "Updated Poha & Upma Breakfast Batch"
    assert donor_edit.get_json()["donation"]["quantityKg"] == 14.5

def test_cancel_donation(client, auth_tokens):
    now = datetime.now(timezone.utc)
    create_res = client.post(
        "/api/donations",
        json={
            "foodName": "Surplus Naan Batch To Cancel",
            "category": "Bakery & Bread",
            "quantityKg": 8.0,
            "availableUntil": (now + timedelta(hours=3)).isoformat(),
            "pickupAddress": "88, Seva Kendra Marg, Bengaluru"
        },
        headers={"Authorization": f"Bearer {auth_tokens['donor']}"}
    )
    donation_id = create_res.get_json()["donation"]["id"]

    cancel_res = client.delete(
        f"/api/donations/{donation_id}",
        headers={"Authorization": f"Bearer {auth_tokens['donor']}"}
    )
    assert cancel_res.status_code == 200

    # Verify status is cancelled in database
    d = get_donations_col().find_one({"_id": ObjectId(donation_id)})
    assert d["status"] == "cancelled"

def test_cannot_cancel_already_delivered_donation(client, auth_tokens):
    # Find a delivered donation
    delivered = get_donations_col().find_one({"status": "delivered"})
    assert delivered is not None

    res = client.delete(
        f"/api/donations/{str(delivered['_id'])}",
        headers={"Authorization": f"Bearer {auth_tokens['donor']}"}
    )
    # Blocked with 400
    assert res.status_code == 400
    assert "Cannot cancel donation" in res.get_json()["error"]
