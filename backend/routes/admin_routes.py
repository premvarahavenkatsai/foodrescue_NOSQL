from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
from bson import ObjectId

from database.connection import (
    get_users_col,
    get_organizations_col,
    get_donations_col,
    serialize_doc
)
from database.validators import validate_object_id
from middleware.auth import token_required, role_required

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/users", methods=["GET"])
@token_required
@role_required("admin")
def list_users():
    users_col = get_users_col()
    role = request.args.get("role")
    search = request.args.get("search")

    query = {}
    if role and role != "all":
        query["role"] = role
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]

    users = list(users_col.find(query).sort("createdAt", -1))
    safe_users = []
    for u in users:
        s = serialize_doc(u)
        s.pop("passwordHash", None)
        safe_users.append(s)

    return jsonify({"users": safe_users, "count": len(safe_users)}), 200

@admin_bp.route("/users/<id>/status", methods=["PUT"])
@token_required
@role_required("admin")
def toggle_user_status(id):
    valid, oid = validate_object_id(id, "User ID")
    if not valid:
        return jsonify({"error": oid}), 400

    data = request.get_json() or {}
    is_active = data.get("isActive")
    if is_active is None:
        return jsonify({"error": "isActive boolean is required"}), 400

    users_col = get_users_col()
    result = users_col.update_one({"_id": oid}, {"$set": {"isActive": bool(is_active)}})
    if result.matched_count == 0:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"message": f"User status updated to {'active' if is_active else 'inactive'}"}), 200

@admin_bp.route("/organizations", methods=["GET"])
@token_required
@role_required("admin")
def list_organizations():
    orgs_col = get_organizations_col()
    status = request.args.get("status")

    query = {}
    if status and status != "all":
        query["verificationStatus"] = status

    orgs = list(orgs_col.find(query).sort("createdAt", -1))
    return jsonify({"organizations": serialize_doc(orgs)}), 200

@admin_bp.route("/organizations/<id>/verify", methods=["PUT"])
@token_required
@role_required("admin")
def verify_organization(id):
    valid, oid = validate_object_id(id, "Organization ID")
    if not valid:
        return jsonify({"error": oid}), 400

    data = request.get_json() or {}
    status = data.get("verificationStatus")
    if status not in ["verified", "rejected", "pending"]:
        return jsonify({"error": "verificationStatus must be 'verified', 'rejected', or 'pending'"}), 400

    orgs_col = get_organizations_col()
    result = orgs_col.update_one({"_id": oid}, {"$set": {"verificationStatus": status}})
    if result.matched_count == 0:
        return jsonify({"error": "Organization not found"}), 404

    return jsonify({"message": f"Organization verification status updated to '{status}'"}), 200

@admin_bp.route("/donations", methods=["GET"])
@token_required
@role_required("admin")
def audit_donations():
    status = request.args.get("status")
    query = {}
    if status and status != "all":
        query["status"] = status

    donations = list(get_donations_col().find(query).sort("createdAt", -1))
    return jsonify({"donations": serialize_doc(donations), "count": len(donations)}), 200
