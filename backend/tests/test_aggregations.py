import pytest
from bson import ObjectId
from services.aggregations import (
    get_rescued_food_trend,
    get_food_donated_by_donor,
    get_top_volunteers,
    get_volunteer_delivery_stats,
    get_donations_by_category_and_status,
    get_ngo_fulfillment_stats,
    get_platform_summary_kpis
)
from database.connection import get_users_col

def test_pipeline_1_rescued_food_trend():
    trend = get_rescued_food_trend(group_by="day")
    assert isinstance(trend, list)
    assert len(trend) > 0
    first = trend[0]
    assert "period" in first
    assert "totalRescuedKg" in first
    assert first["totalRescuedKg"] > 0
    assert "deliveryCount" in first

def test_pipeline_2_food_donated_by_donor():
    donors = get_food_donated_by_donor()
    assert isinstance(donors, list)
    assert len(donors) > 0
    top_donor = donors[0]
    assert "donorName" in top_donor
    assert "totalDonatedKg" in top_donor
    assert top_donor["totalDonatedKg"] > 0
    # Ensure descending order
    if len(donors) > 1:
        assert donors[0]["totalDonatedKg"] >= donors[1]["totalDonatedKg"]

def test_pipeline_3_top_volunteers():
    leaderboard = get_top_volunteers(limit=5)
    assert isinstance(leaderboard, list)
    assert len(leaderboard) > 0
    first = leaderboard[0]
    assert "name" in first
    assert "totalPoints" in first
    assert "badges" in first
    assert first["rank"] == 1
    # Check descending order by points
    if len(leaderboard) > 1:
        assert leaderboard[0]["totalPoints"] >= leaderboard[1]["totalPoints"]

def test_pipeline_4_volunteer_delivery_stats():
    stats = get_volunteer_delivery_stats()
    assert isinstance(stats, list)
    assert len(stats) > 0
    first = stats[0]
    assert "volunteerName" in first
    assert "verifiedFoodDeliveredKg" in first
    assert first["verifiedFoodDeliveredKg"] > 0

def test_pipeline_5_category_and_status_breakdown():
    breakdown = get_donations_by_category_and_status()
    assert isinstance(breakdown, list)
    assert len(breakdown) > 0
    first = breakdown[0]
    assert "category" in first
    assert "status" in first
    assert "count" in first

def test_pipeline_6_ngo_fulfillment_stats():
    fulfillment = get_ngo_fulfillment_stats()
    assert isinstance(fulfillment, list)
    assert len(fulfillment) > 0
    first = fulfillment[0]
    assert "organizationName" in first
    assert "totalRequests" in first
    assert "fulfillmentRate" in first
    assert 0 <= first["fulfillmentRate"] <= 100

def test_platform_summary_kpis():
    kpis = get_platform_summary_kpis()
    assert "totalRescuedKg" in kpis
    assert kpis["totalRescuedKg"] > 0
    assert "estimatedMeals" in kpis
    assert kpis["estimatedMeals"] > 0
    assert "completedDeliveries" in kpis

def test_certificate_eligibility(client, auth_tokens):
    # Vol 1 has completed deliveries -> eligible
    vol1_id = str(auth_tokens["vol_user"]["_id"])
    res = client.get(
        f"/api/analytics/certificate/{vol1_id}",
        headers={"Authorization": f"Bearer {auth_tokens['volunteer']}"}
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data["certificate"]["eligible"] is True
    assert "FR-CERT-" in data["certificate"]["certificateId"]

    # Ineligible volunteer with 0 deliveries
    users_col = get_users_col()
    vol4 = users_col.find_one({"email": "volunteer4@foodrescue.org"})
    assert vol4 is not None
    ineligible_res = client.get(
        f"/api/analytics/certificate/{str(vol4['_id'])}",
        headers={"Authorization": f"Bearer {auth_tokens['volunteer']}"}
    )
    assert ineligible_res.status_code == 400
    assert ineligible_res.get_json()["eligible"] is False
