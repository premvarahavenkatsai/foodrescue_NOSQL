import pytest
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from database.connection import get_donations_col, get_deliveries_col, get_volunteers_col
from services.reward_service import confirm_and_complete_delivery

def test_complete_rescue_workflow_end_to_end(client, auth_tokens):
    """
    Validates end-to-end lifecycle:
    Donor creates -> NGO requests -> Donor approves -> Volunteer accepts ->
    Volunteer picks up -> NGO confirms receipt -> Points awarded exactly once.
    """
    now = datetime.now(timezone.utc)

    # 1. Donor creates donation
    don_res = client.post(
        "/api/donations",
        json={
            "foodName": "End-to-End Hyderabadi Paneer Pulao",
            "category": "Cooked Meals",
            "quantityKg": 20.0,
            "availableUntil": (now + timedelta(hours=10)).isoformat(),
            "pickupAddress": "Community Kitchen 101, Indiranagar, Bengaluru",
            "dietaryInfo": ["Pure Vegetarian"]
        },
        headers={"Authorization": f"Bearer {auth_tokens['donor']}"}
    )
    assert don_res.status_code == 201
    donation_id = don_res.get_json()["donation"]["id"]

    # 2. NGO requests the donation
    req_res = client.post(
        "/api/requests",
        json={"donationId": donation_id, "requestedQuantityKg": 20.0},
        headers={"Authorization": f"Bearer {auth_tokens['ngo']}"}
    )
    assert req_res.status_code == 201
    request_id = req_res.get_json()["request"]["id"]

    # 3. Donor reviews and approves request
    review_res = client.post(
        f"/api/requests/{request_id}/review",
        json={"action": "approve"},
        headers={"Authorization": f"Bearer {auth_tokens['donor']}"}
    )
    assert review_res.status_code == 200
    task_id = review_res.get_json()["deliveryTask"]["id"]

    # 4. Volunteer accepts task
    accept_res = client.post(
        f"/api/deliveries/{task_id}/accept",
        headers={"Authorization": f"Bearer {auth_tokens['volunteer']}"}
    )
    assert accept_res.status_code == 200
    assert accept_res.get_json()["task"]["status"] == "accepted"

    # 5. Volunteer picks up food
    pickup_res = client.post(
        f"/api/deliveries/{task_id}/pickup",
        headers={"Authorization": f"Bearer {auth_tokens['volunteer']}"}
    )
    assert pickup_res.status_code == 200
    assert pickup_res.get_json()["task"]["status"] == "picked_up"

    # Check volunteer profile points before confirmation
    vol_user_id = auth_tokens["vol_user"]["_id"]
    vol_col = get_volunteers_col()
    profile_before = vol_col.find_one({"userId": vol_user_id})
    points_before = profile_before.get("totalPoints", 0)

    # 6. NGO confirms receipt
    confirm_res = client.post(
        f"/api/deliveries/{task_id}/confirm-receipt",
        headers={"Authorization": f"Bearer {auth_tokens['ngo']}"}
    )
    assert confirm_res.status_code == 200
    confirm_data = confirm_res.get_json()
    assert confirm_data["details"]["pointsAwarded"] == 60  # 20 base + (20kg * 2) = 60

    # Verify volunteer profile points increased
    profile_after = vol_col.find_one({"userId": vol_user_id})
    assert profile_after["totalPoints"] == points_before + 60

    # 7. IDEMPOTENCY: Duplicate delivery confirmation attempt is blocked
    dup_confirm = client.post(
        f"/api/deliveries/{task_id}/confirm-receipt",
        headers={"Authorization": f"Bearer {auth_tokens['ngo']}"}
    )
    assert dup_confirm.status_code == 400
    assert "already" in dup_confirm.get_json()["error"]

    # Points must remain unchanged after duplicate attempt
    profile_check = vol_col.find_one({"userId": vol_user_id})
    assert profile_check["totalPoints"] == points_before + 60

def test_prevent_duplicate_claims_on_same_donation(client, auth_tokens):
    """
    Proves that two NGOs cannot both claim the same available donation.
    The second request is rejected with 409 Conflict.
    """
    now = datetime.now(timezone.utc)
    # Create single available donation
    don_res = client.post(
        "/api/donations",
        json={
            "foodName": "Fresh Alphonso Mango Crates",
            "category": "Fresh Produce",
            "quantityKg": 15.0,
            "availableUntil": (now + timedelta(hours=5)).isoformat(),
            "pickupAddress": "Orchard Market, Dadar, Mumbai"
        },
        headers={"Authorization": f"Bearer {auth_tokens['donor']}"}
    )
    donation_id = don_res.get_json()["donation"]["id"]

    # First claim succeeds
    first_claim = client.post(
        "/api/requests",
        json={"donationId": donation_id, "requestedQuantityKg": 15.0},
        headers={"Authorization": f"Bearer {auth_tokens['ngo']}"}
    )
    assert first_claim.status_code == 201

    # Second claim on the same donation is rejected
    second_claim = client.post(
        "/api/requests",
        json={"donationId": donation_id, "requestedQuantityKg": 15.0},
        headers={"Authorization": f"Bearer {auth_tokens['ngo']}"}
    )
    assert second_claim.status_code == 409
    assert "no longer available" in second_claim.get_json()["error"]

def test_prevent_duplicate_task_acceptance(client, auth_tokens):
    """
    Proves that two volunteers cannot accept the same delivery task.
    The second acceptance is rejected with 409 Conflict.
    """
    now = datetime.now(timezone.utc)
    # Setup donation and approved request
    don_res = client.post(
        "/api/donations",
        json={
            "foodName": "Fresh Tawa Roti & Paratha Batch",
            "category": "Bakery & Bread",
            "quantityKg": 10.0,
            "availableUntil": (now + timedelta(hours=6)).isoformat(),
            "pickupAddress": "Banjara Sweets & Bakers, Hyderabad"
        },
        headers={"Authorization": f"Bearer {auth_tokens['donor']}"}
    )
    donation_id = don_res.get_json()["donation"]["id"]

    req_res = client.post(
        "/api/requests",
        json={"donationId": donation_id, "requestedQuantityKg": 10.0},
        headers={"Authorization": f"Bearer {auth_tokens['ngo']}"}
    )
    request_id = req_res.get_json()["request"]["id"]

    review_res = client.post(
        f"/api/requests/{request_id}/review",
        json={"action": "approve"},
        headers={"Authorization": f"Bearer {auth_tokens['donor']}"}
    )
    task_id = review_res.get_json()["deliveryTask"]["id"]

    # First volunteer accepts
    first_accept = client.post(
        f"/api/deliveries/{task_id}/accept",
        headers={"Authorization": f"Bearer {auth_tokens['volunteer']}"}
    )
    assert first_accept.status_code == 200

    # Second volunteer attempts to accept the same task
    second_accept = client.post(
        f"/api/deliveries/{task_id}/accept",
        headers={"Authorization": f"Bearer {auth_tokens['volunteer']}"}
    )
    assert second_accept.status_code == 409
    assert "already" in second_accept.get_json()["error"]
