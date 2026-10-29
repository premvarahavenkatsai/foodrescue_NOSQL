from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
from bson import ObjectId

from database.connection import (
    get_donations_col,
    get_users_col,
    get_deliveries_col,
    serialize_doc
)
from database.validators import validate_donation_input, validate_object_id
from middleware.auth import token_required, role_required

donation_bp = Blueprint("donations", __name__)

@donation_bp.route("", methods=["GET"])
def get_donations():
    """
    Public and NGO discovery endpoint with filtering.
    """
    donations_col = get_donations_col()

    category = request.args.get("category")
    status = request.args.get("status", "available")
    min_qty = request.args.get("minQuantity")
    max_qty = request.args.get("maxQuantity")
    search = request.args.get("search")

    query = {}
    if status and status != "all":
        query["status"] = status

    if category and category != "all":
        query["category"] = category

    if min_qty or max_qty:
        query["quantityKg"] = {}
        if min_qty:
            query["quantityKg"]["$gte"] = float(min_qty)
        if max_qty:
            query["quantityKg"]["$lte"] = float(max_qty)

    if search:
        query["$or"] = [
            {"foodName": {"$regex": search, "$options": "i"}},
            {"pickupAddress": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]

    donations = list(donations_col.find(query).sort("createdAt", -1))

    # Enrich with donor summary information
    donor_ids = list({d["donorId"] for d in donations if "donorId" in d})
    donors = {u["_id"]: u for u in get_users_col().find({"_id": {"$in": donor_ids}})}

    enriched = []
    for d in donations:
        d_serialized = serialize_doc(d)
        donor = donors.get(d.get("donorId"))
        if donor:
            d_serialized["donorName"] = donor.get("name")
            d_serialized["donorPhone"] = donor.get("phone")
        enriched.append(d_serialized)

    return jsonify({"donations": enriched, "count": len(enriched)}), 200

@donation_bp.route("/<id>", methods=["GET"])
def get_donation_by_id(id):
    valid, res = validate_object_id(id, "Donation ID")
    if not valid:
        return jsonify({"error": res}), 400

    donations_col = get_donations_col()
    donation = donations_col.find_one({"_id": res})
    if not donation:
        return jsonify({"error": "Donation listing not found"}), 404

    serialized = serialize_doc(donation)
    donor = get_users_col().find_one({"_id": donation.get("donorId")})
    if donor:
        serialized["donorName"] = donor.get("name")
        serialized["donorEmail"] = donor.get("email")
        serialized["donorPhone"] = donor.get("phone")

    # If delivery task exists, attach delivery info
    delivery = get_deliveries_col().find_one({"donationId": res})
    if delivery:
        serialized["deliveryTask"] = serialize_doc(delivery)

    return jsonify({"donation": serialized}), 200

@donation_bp.route("", methods=["POST"])
@token_required
@role_required("donor", "admin")
def create_donation():
    data = request.get_json() or {}
    errors = validate_donation_input(data)
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    now = datetime.now(timezone.utc)

    # Parse availableUntil ISO date
    try:
        available_until_str = data.get("availableUntil")
        available_until_dt = datetime.fromisoformat(available_until_str.replace("Z", "+00:00"))
    except Exception:
        return jsonify({"error": "Invalid availableUntil datetime format"}), 400

    # Prepared time
    prepared_at_dt = now
    if data.get("preparedAt"):
        try:
            prepared_at_dt = datetime.fromisoformat(data.get("preparedAt").replace("Z", "+00:00"))
        except Exception:
            pass

    dietary_info = data.get("dietaryInfo", [])
    if isinstance(dietary_info, str):
        dietary_info = [tag.strip() for tag in dietary_info.split(",") if tag.strip()]

    donation_doc = {
        "donorId": request.user["_id"],
        "foodName": data.get("foodName", "").strip(),
        "category": data.get("category"),
        "quantityKg": float(data.get("quantityKg")),
        "preparedAt": prepared_at_dt,
        "availableUntil": available_until_dt,
        "pickupAddress": data.get("pickupAddress", "").strip() or request.user.get("address", ""),
        "dietaryInfo": dietary_info,
        "description": data.get("description", "").strip(),
        "status": "available",
        "createdAt": now,
        "updatedAt": now
    }

    try:
        result = get_donations_col().insert_one(donation_doc)
        donation_doc["_id"] = result.inserted_id
        return jsonify({
            "message": "Donation created successfully",
            "donation": serialize_doc(donation_doc)
        }), 201
    except Exception as e:
        return jsonify({"error": f"Failed to create donation: {str(e)}"}), 500

@donation_bp.route("/<id>", methods=["PUT"])
@token_required
@role_required("donor", "admin")
def update_donation(id):
    valid, oid = validate_object_id(id, "Donation ID")
    if not valid:
        return jsonify({"error": oid}), 400

    donations_col = get_donations_col()
    existing = donations_col.find_one({"_id": oid})
    if not existing:
        return jsonify({"error": "Donation not found"}), 404

    # Ownership check
    if str(existing.get("donorId")) != str(request.user["_id"]) and request.user.get("role") != "admin":
        return jsonify({"error": "Unauthorized. You may only edit your own donations."}), 403

    # Only available donations can be edited
    if existing.get("status") != "available":
        return jsonify({"error": f"Cannot edit donation in '{existing.get('status')}' status"}), 400

    data = request.get_json() or {}
    errors = validate_donation_input(data, is_update=True)
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    now = datetime.now(timezone.utc)
    update_fields = {"updatedAt": now}

    if "foodName" in data:
        update_fields["foodName"] = data["foodName"].strip()
    if "category" in data:
        update_fields["category"] = data["category"]
    if "quantityKg" in data:
        update_fields["quantityKg"] = float(data["quantityKg"])
    if "pickupAddress" in data:
        update_fields["pickupAddress"] = data["pickupAddress"].strip()
    if "description" in data:
        update_fields["description"] = data["description"].strip()
    if "dietaryInfo" in data:
        dietary_info = data["dietaryInfo"]
        if isinstance(dietary_info, str):
            dietary_info = [tag.strip() for tag in dietary_info.split(",") if tag.strip()]
        update_fields["dietaryInfo"] = dietary_info
    if "availableUntil" in data:
        update_fields["availableUntil"] = datetime.fromisoformat(data["availableUntil"].replace("Z", "+00:00"))

    donations_col.update_one({"_id": oid}, {"$set": update_fields})
    updated = donations_col.find_one({"_id": oid})

    return jsonify({
        "message": "Donation updated successfully",
        "donation": serialize_doc(updated)
    }), 200

@donation_bp.route("/<id>", methods=["DELETE"])
@token_required
@role_required("donor", "admin")
def cancel_donation(id):
    valid, oid = validate_object_id(id, "Donation ID")
    if not valid:
        return jsonify({"error": oid}), 400

    donations_col = get_donations_col()
    existing = donations_col.find_one({"_id": oid})
    if not existing:
        return jsonify({"error": "Donation not found"}), 404

    # Ownership check
    if str(existing.get("donorId")) != str(request.user["_id"]) and request.user.get("role") != "admin":
        return jsonify({"error": "Unauthorized to cancel this donation"}), 403

    # Cannot cancel if already picked up or delivered
    if existing.get("status") in ["picked_up", "delivered"]:
        return jsonify({"error": f"Cannot cancel donation that is already '{existing.get('status')}'"}), 400

    now = datetime.now(timezone.utc)
    donations_col.update_one({"_id": oid}, {"$set": {"status": "cancelled", "updatedAt": now}})

    return jsonify({"message": "Donation cancelled successfully"}), 200

@donation_bp.route("/my-donations", methods=["GET"])
@token_required
@role_required("donor", "admin")
def get_my_donations():
    donations_col = get_donations_col()
    donor_id = request.user["_id"]

    donations = list(donations_col.find({"donorId": donor_id}).sort("createdAt", -1))

    # Calculate summary metrics for this donor
    total_kg = sum(d.get("quantityKg", 0.0) for d in donations if d.get("status") != "cancelled")
    rescued_kg = sum(d.get("quantityKg", 0.0) for d in donations if d.get("status") == "delivered")
    active_count = sum(1 for d in donations if d.get("status") in ["available", "requested", "assigned", "picked_up"])

    return jsonify({
        "donations": serialize_doc(donations),
        "totalDonations": len(donations),
        "totalKgDonated": round(total_kg, 2),
        "rescuedKg": round(rescued_kg, 2),
        "activeCount": active_count
    }), 200
