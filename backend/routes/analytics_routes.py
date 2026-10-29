from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
from bson import ObjectId

from database.connection import get_users_col, get_volunteers_col, get_deliveries_col, serialize_doc
from services.aggregations import (
    get_rescued_food_trend,
    get_food_donated_by_donor,
    get_top_volunteers,
    get_volunteer_delivery_stats,
    get_donations_by_category_and_status,
    get_ngo_fulfillment_stats,
    get_platform_summary_kpis
)
from middleware.auth import token_required

analytics_bp = Blueprint("analytics", __name__)

@analytics_bp.route("/kpis", methods=["GET"])
def kpis():
    """Returns platform-wide live summary KPIs calculated from database records."""
    data = get_platform_summary_kpis()
    return jsonify({"kpis": data}), 200

@analytics_bp.route("/rescued-trend", methods=["GET"])
def rescued_trend():
    """Pipeline 1: Food rescued in kg grouped by day or month (excluding unverified/cancelled)."""
    group_by = request.args.get("groupBy", "day")
    data = get_rescued_food_trend(group_by=group_by)
    return jsonify({"trend": data}), 200

@analytics_bp.route("/donor-contributions", methods=["GET"])
def donor_contributions():
    """Pipeline 2: Food donated by each donor."""
    data = get_food_donated_by_donor()
    return jsonify({"donors": data}), 200

@analytics_bp.route("/leaderboard", methods=["GET"])
def leaderboard():
    """Pipeline 3: Top volunteers ranked by verified completed deliveries."""
    limit = int(request.args.get("limit", 10))
    data = get_top_volunteers(limit=limit)
    return jsonify({"leaderboard": data}), 200

@analytics_bp.route("/volunteer-stats", methods=["GET"])
def volunteer_stats():
    """Pipeline 4: Total food delivered by each volunteer directly aggregated from tasks."""
    data = get_volunteer_delivery_stats()
    return jsonify({"volunteerStats": data}), 200

@analytics_bp.route("/category-breakdown", methods=["GET"])
def category_breakdown():
    """Pipeline 5: Donation counts grouped by food category and status."""
    data = get_donations_by_category_and_status()
    return jsonify({"breakdown": data}), 200

@analytics_bp.route("/ngo-fulfillment", methods=["GET"])
def ngo_fulfillment():
    """Pipeline 6: NGO request fulfillment statistics."""
    data = get_ngo_fulfillment_stats()
    return jsonify({"fulfillment": data}), 200

@analytics_bp.route("/certificate/<volunteer_id>", methods=["GET"])
@token_required
def get_certificate(volunteer_id):
    """
    Validates eligibility and provides official verification metadata for printable certificate.
    Eligibility requirement: At least 1 verified completed delivery.
    """
    if not ObjectId.is_valid(volunteer_id):
        return jsonify({"error": "Invalid volunteer ID"}), 400

    vol_oid = ObjectId(volunteer_id)
    user = get_users_col().find_one({"_id": vol_oid, "role": "volunteer"})
    if not user:
        return jsonify({"error": "Volunteer not found"}), 404

    profile = get_volunteers_col().find_one({"userId": vol_oid})
    if not profile:
        return jsonify({"error": "Volunteer profile not found"}), 404

    total_deliveries = profile.get("totalDeliveries", 0)
    if total_deliveries < 1:
        return jsonify({
            "eligible": False,
            "message": "Certificate requires at least 1 verified completed food rescue delivery."
        }), 400

    cert_id = f"FR-CERT-{str(vol_oid)[-6:].upper()}-{profile.get('totalPoints', 100)}"
    now = datetime.now(timezone.utc)

    # Estimate volunteer hours (approx 1.5 hours per rescue mission)
    estimated_hours = round(total_deliveries * 1.5, 1)

    certificate_data = {
        "eligible": True,
        "certificateId": cert_id,
        "volunteerName": user.get("name"),
        "volunteerEmail": user.get("email"),
        "totalDeliveries": total_deliveries,
        "totalFoodDeliveredKg": profile.get("totalFoodDeliveredKg", 0.0),
        "totalPoints": profile.get("totalPoints", 0),
        "badges": profile.get("badges", []),
        "estimatedServiceHours": estimated_hours,
        "issueDate": now.strftime("%B %d, %Y"),
        "authorizedBy": "FoodRescue Academic Initiative - Intelligent NoSQL Platform"
    }

    return jsonify({"certificate": certificate_data}), 200
