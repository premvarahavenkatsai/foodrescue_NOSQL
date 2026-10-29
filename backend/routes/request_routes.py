from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
from bson import ObjectId

from database.connection import (
    get_requests_col,
    get_donations_col,
    get_organizations_col,
    get_deliveries_col,
    serialize_doc
)
from database.validators import validate_object_id
from middleware.auth import token_required, role_required

request_bp = Blueprint("requests", __name__)

@request_bp.route("", methods=["POST"])
@token_required
@role_required("ngo", "admin")
def create_request():
    """
    Submits a donation request on an available food listing.
    Protects against race conditions: uses atomic find_one_and_update to claim the donation.
    """
    data = request.get_json() or {}
    donation_id_str = data.get("donationId")
    valid, donation_id = validate_object_id(donation_id_str, "Donation ID")
    if not valid:
        return jsonify({"error": donation_id}), 400

    # Retrieve NGO organization profile
    org_col = get_organizations_col()
    org = org_col.find_one({"userId": request.user["_id"]})
    if not org and request.user.get("role") != "admin":
        return jsonify({"error": "NGO organization profile not found"}), 404

    org_id = org["_id"] if org else request.user["_id"]

    donations_col = get_donations_col()
    now = datetime.now(timezone.utc)

    # ATOMIC CLAIM: Only claim if donation status is currently 'available'
    # Prevents two NGOs from claiming the exact same donation simultaneously
    claimed_donation = donations_col.find_one_and_update(
        {"_id": donation_id, "status": "available"},
        {"$set": {"status": "requested", "updatedAt": now}},
        return_document=True
    )

    if not claimed_donation:
        # Check why it couldn't be claimed
        existing = donations_col.find_one({"_id": donation_id})
        if not existing:
            return jsonify({"error": "Donation does not exist"}), 404
        return jsonify({
            "error": f"Donation is no longer available. Current status: '{existing.get('status')}'"
        }), 409

    requested_qty = float(data.get("requestedQuantityKg") or claimed_donation["quantityKg"])

    request_doc = {
        "donationId": donation_id,
        "organizationId": org_id,
        "requestedQuantityKg": requested_qty,
        "status": "pending",
        "requestedAt": now,
        "reviewedAt": None
    }

    try:
        req_res = get_requests_col().insert_one(request_doc)
        request_doc["_id"] = req_res.inserted_id

        return jsonify({
            "message": "Donation request submitted successfully",
            "request": serialize_doc(request_doc),
            "donation": serialize_doc(claimed_donation)
        }), 201
    except Exception as e:
        # Rollback donation status if request insertion fails
        donations_col.update_one({"_id": donation_id}, {"$set": {"status": "available", "updatedAt": now}})
        return jsonify({"error": f"Failed to submit request: {str(e)}"}), 500

@request_bp.route("/my-requests", methods=["GET"])
@token_required
@role_required("ngo", "admin")
def get_my_requests():
    """
    Returns all requests submitted by the current NGO organization.
    """
    org_col = get_organizations_col()
    org = org_col.find_one({"userId": request.user["_id"]})
    if not org and request.user.get("role") != "admin":
        return jsonify({"requests": []}), 200

    filter_query = {"organizationId": org["_id"]} if org else {}
    requests = list(get_requests_col().find(filter_query).sort("requestedAt", -1))

    # Enrich with donation and delivery task details
    donation_ids = [r["donationId"] for r in requests if "donationId" in r]
    donations = {d["_id"]: d for d in get_donations_col().find({"_id": {"$in": donation_ids}})}
    deliveries = {deliv["requestId"]: deliv for deliv in get_deliveries_col().find({"requestId": {"$in": [r["_id"] for r in requests]}})}

    enriched = []
    for r in requests:
        r_ser = serialize_doc(r)
        don = donations.get(r.get("donationId"))
        if don:
            r_ser["donation"] = serialize_doc(don)
        deliv = deliveries.get(r.get("_id"))
        if deliv:
            r_ser["deliveryTask"] = serialize_doc(deliv)
        enriched.append(r_ser)

    return jsonify({"requests": enriched, "count": len(enriched)}), 200

@request_bp.route("/<id>/review", methods=["POST"])
@token_required
@role_required("donor", "admin")
def review_request(id):
    """
    Donor reviews an incoming request (approve or reject).
    If approved, automatically spawns a delivery task for volunteers.
    If rejected, releases donation back to 'available'.
    """
    valid, req_id = validate_object_id(id, "Request ID")
    if not valid:
        return jsonify({"error": req_id}), 400

    data = request.get_json() or {}
    action = data.get("action")  # 'approve' or 'reject'
    if action not in ["approve", "reject"]:
        return jsonify({"error": "Action must be 'approve' or 'reject'"}), 400

    requests_col = get_requests_col()
    req = requests_col.find_one({"_id": req_id})
    if not req:
        return jsonify({"error": "Request not found"}), 404

    donations_col = get_donations_col()
    donation = donations_col.find_one({"_id": req["donationId"]})
    if not donation:
        return jsonify({"error": "Associated donation not found"}), 404

    # Verify donor authorization
    if str(donation.get("donorId")) != str(request.user["_id"]) and request.user.get("role") != "admin":
        return jsonify({"error": "Unauthorized to review this request"}), 403

    now = datetime.now(timezone.utc)

    if action == "approve":
        # Update request
        requests_col.update_one(
            {"_id": req_id},
            {"$set": {"status": "approved", "reviewedAt": now}}
        )
        # Update donation
        donations_col.update_one(
            {"_id": donation["_id"]},
            {"$set": {"status": "assigned", "updatedAt": now}}
        )
        # Create delivery task
        task_doc = {
            "donationId": donation["_id"],
            "requestId": req_id,
            "volunteerId": None,
            "status": "pending_assignment",
            "pickedUpAt": None,
            "deliveredAt": None,
            "foodQuantityKg": req["requestedQuantityKg"],
            "pointsAwarded": False,
            "createdAt": now
        }
        deliv_res = get_deliveries_col().insert_one(task_doc)
        task_doc["_id"] = deliv_res.inserted_id

        return jsonify({
            "message": "Donation request approved. Delivery task generated for volunteers.",
            "deliveryTask": serialize_doc(task_doc)
        }), 200

    else: # reject
        requests_col.update_one(
            {"_id": req_id},
            {"$set": {"status": "rejected", "reviewedAt": now}}
        )
        # Revert donation back to available
        donations_col.update_one(
            {"_id": donation["_id"]},
            {"$set": {"status": "available", "updatedAt": now}}
        )
        return jsonify({"message": "Donation request rejected. Food returned to available pool."}), 200
