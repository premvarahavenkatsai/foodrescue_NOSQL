from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
from bson import ObjectId

from database.connection import (
    get_deliveries_col,
    get_donations_col,
    get_requests_col,
    get_organizations_col,
    get_users_col,
    get_volunteers_col,
    serialize_doc
)
from database.validators import validate_object_id
from middleware.auth import token_required, role_required
from services.reward_service import confirm_and_complete_delivery

delivery_bp = Blueprint("deliveries", __name__)

@delivery_bp.route("/available-tasks", methods=["GET"])
@token_required
@role_required("volunteer", "admin")
def get_available_tasks():
    """
    Lists tasks awaiting a volunteer pickup.
    Enriched with pickup address, destination NGO address, food category, and quantity.
    """
    deliveries_col = get_deliveries_col()
    tasks = list(deliveries_col.find({
        "status": "pending_assignment",
        "volunteerId": None
    }).sort("createdAt", -1))

    donation_ids = [t["donationId"] for t in tasks if "donationId" in t]
    request_ids = [t["requestId"] for t in tasks if "requestId" in t]

    donations = {d["_id"]: d for d in get_donations_col().find({"_id": {"$in": donation_ids}})}
    requests = {r["_id"]: r for r in get_requests_col().find({"_id": {"$in": request_ids}})}

    org_ids = [r["organizationId"] for r in requests.values() if "organizationId" in r]
    orgs = {o["_id"]: o for o in get_organizations_col().find({"_id": {"$in": org_ids}})}

    enriched = []
    for t in tasks:
        t_ser = serialize_doc(t)
        don = donations.get(t.get("donationId"))
        req = requests.get(t.get("requestId"))
        if don:
            t_ser["foodName"] = don.get("foodName")
            t_ser["category"] = don.get("category")
            t_ser["pickupAddress"] = don.get("pickupAddress")
            t_ser["availableUntil"] = don.get("availableUntil").isoformat() if don.get("availableUntil") else None
            t_ser["dietaryInfo"] = don.get("dietaryInfo", [])
        if req:
            org = orgs.get(req.get("organizationId"))
            if org:
                t_ser["organizationName"] = org.get("organizationName")
                t_ser["destinationAddress"] = org.get("serviceArea")
        enriched.append(t_ser)

    return jsonify({"tasks": enriched, "count": len(enriched)}), 200

@delivery_bp.route("/<id>/accept", methods=["POST"])
@token_required
@role_required("volunteer", "admin")
def accept_task(id):
    """
    Volunteer accepts an open task.
    CONCURRENCY PROTECTION: Atomic find_one_and_update ensures exactly one volunteer can claim it.
    """
    valid, task_id = validate_object_id(id, "Task ID")
    if not valid:
        return jsonify({"error": task_id}), 400

    deliveries_col = get_deliveries_col()
    user_id = request.user["_id"]

    # Atomic assignment condition
    updated_task = deliveries_col.find_one_and_update(
        {
            "_id": task_id,
            "status": "pending_assignment",
            "volunteerId": None
        },
        {
            "$set": {
                "status": "accepted",
                "volunteerId": user_id
            }
        },
        return_document=True
    )

    if not updated_task:
        existing = deliveries_col.find_one({"_id": task_id})
        if not existing:
            return jsonify({"error": "Task not found"}), 404
        return jsonify({
            "error": "This delivery task has already been accepted by another volunteer."
        }), 409

    # Update donation status
    now = datetime.now(timezone.utc)
    get_donations_col().update_one(
        {"_id": updated_task["donationId"]},
        {"$set": {"status": "assigned", "updatedAt": now}}
    )

    return jsonify({
        "message": "Delivery task accepted successfully",
        "task": serialize_doc(updated_task)
    }), 200

@delivery_bp.route("/<id>/pickup", methods=["POST"])
@token_required
@role_required("volunteer", "admin")
def mark_picked_up(id):
    """
    Volunteer confirms they have collected the food from the donor.
    """
    valid, task_id = validate_object_id(id, "Task ID")
    if not valid:
        return jsonify({"error": task_id}), 400

    deliveries_col = get_deliveries_col()
    now = datetime.now(timezone.utc)
    user_id = request.user["_id"]

    query = {"_id": task_id, "status": "accepted"}
    if request.user.get("role") != "admin":
        query["volunteerId"] = user_id

    updated = deliveries_col.find_one_and_update(
        query,
        {"$set": {"status": "picked_up", "pickedUpAt": now}},
        return_document=True
    )

    if not updated:
        return jsonify({"error": "Task cannot be marked as picked up (invalid status or unauthorized)"}), 400

    get_donations_col().update_one(
        {"_id": updated["donationId"]},
        {"$set": {"status": "picked_up", "updatedAt": now}}
    )

    return jsonify({
        "message": "Food marked as picked up. En route to NGO.",
        "task": serialize_doc(updated)
    }), 200

@delivery_bp.route("/<id>/confirm-receipt", methods=["POST"])
@token_required
@role_required("ngo", "admin")
def confirm_receipt(id):
    """
    NGO confirms food arrival and condition.
    Triggers atomic points award, badge checks, and marks donation as rescued.
    """
    success, msg, data = confirm_and_complete_delivery(id)
    if not success:
        return jsonify({"error": msg}), 400

    return jsonify({
        "message": msg,
        "details": data
    }), 200

@delivery_bp.route("/my-tasks", methods=["GET"])
@token_required
@role_required("volunteer", "admin")
def get_my_tasks():
    """
    Lists active and completed tasks assigned to current volunteer.
    """
    deliveries_col = get_deliveries_col()
    user_id = request.user["_id"]

    tasks = list(deliveries_col.find({"volunteerId": user_id}).sort("createdAt", -1))

    donation_ids = [t["donationId"] for t in tasks if "donationId" in t]
    request_ids = [t["requestId"] for t in tasks if "requestId" in t]

    donations = {d["_id"]: d for d in get_donations_col().find({"_id": {"$in": donation_ids}})}
    requests = {r["_id"]: r for r in get_requests_col().find({"_id": {"$in": request_ids}})}
    org_ids = [r["organizationId"] for r in requests.values() if "organizationId" in r]
    orgs = {o["_id"]: o for o in get_organizations_col().find({"_id": {"$in": org_ids}})}

    enriched = []
    for t in tasks:
        t_ser = serialize_doc(t)
        don = donations.get(t.get("donationId"))
        req = requests.get(t.get("requestId"))
        if don:
            t_ser["foodName"] = don.get("foodName")
            t_ser["category"] = don.get("category")
            t_ser["pickupAddress"] = don.get("pickupAddress")
        if req:
            org = orgs.get(req.get("organizationId"))
            if org:
                t_ser["organizationName"] = org.get("organizationName")
                t_ser["destinationAddress"] = org.get("serviceArea")
        enriched.append(t_ser)

    return jsonify({"tasks": enriched, "count": len(enriched)}), 200
