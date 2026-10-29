from flask import Blueprint, request, jsonify
from database.connection import get_users_col, get_volunteers_col, get_organizations_col, serialize_doc
from middleware.auth import token_required

user_bp = Blueprint("users", __name__)

@user_bp.route("/profile", methods=["GET"])
@token_required
def get_profile():
    user = request.user
    safe_user = serialize_doc(user)
    safe_user.pop("passwordHash", None)

    if user.get("role") == "volunteer":
        vol = get_volunteers_col().find_one({"userId": user["_id"]})
        safe_user["volunteerProfile"] = serialize_doc(vol)
    elif user.get("role") == "ngo":
        org = get_organizations_col().find_one({"userId": user["_id"]})
        safe_user["organization"] = serialize_doc(org)

    return jsonify({"user": safe_user}), 200

@user_bp.route("/profile", methods=["PUT"])
@token_required
def update_profile():
    data = request.get_json() or {}
    user_id = request.user["_id"]
    users_col = get_users_col()

    update_fields = {}
    if "name" in data and len(data["name"].strip()) >= 2:
        update_fields["name"] = data["name"].strip()
    if "phone" in data:
        update_fields["phone"] = data["phone"].strip()
    if "address" in data:
        update_fields["address"] = data["address"].strip()

    if update_fields:
        users_col.update_one({"_id": user_id}, {"$set": update_fields})

    updated_user = users_col.find_one({"_id": user_id})
    safe = serialize_doc(updated_user)
    safe.pop("passwordHash", None)

    return jsonify({"message": "Profile updated successfully", "user": safe}), 200

@user_bp.route("/volunteer-profile", methods=["PUT"])
@token_required
def update_volunteer_profile():
    if request.user.get("role") not in ["volunteer", "admin"]:
        return jsonify({"error": "Only volunteers can update volunteer profile"}), 403

    data = request.get_json() or {}
    vol_col = get_volunteers_col()
    user_id = request.user["_id"]

    update_fields = {}
    if "serviceArea" in data:
        update_fields["serviceArea"] = data["serviceArea"].strip()
    if "availability" in data and data["availability"] in ["available", "busy", "unavailable"]:
        update_fields["availability"] = data["availability"]
    if "transportType" in data and data["transportType"] in ["walking", "bicycle", "motorcycle", "car", "van"]:
        update_fields["transportType"] = data["transportType"]
    if "transportCapacityKg" in data:
        try:
            cap = float(data["transportCapacityKg"])
            if cap >= 0:
                update_fields["transportCapacityKg"] = cap
        except (ValueError, TypeError):
            pass

    if update_fields:
        vol_col.update_one({"userId": user_id}, {"$set": update_fields})

    updated_profile = vol_col.find_one({"userId": user_id})
    return jsonify({
        "message": "Volunteer profile updated successfully",
        "profile": serialize_doc(updated_profile)
    }), 200
