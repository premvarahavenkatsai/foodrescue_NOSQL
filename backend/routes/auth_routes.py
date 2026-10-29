from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId

from database.connection import (
    get_users_col,
    get_organizations_col,
    get_volunteers_col,
    serialize_doc
)
from database.validators import validate_user_input
from middleware.auth import generate_token, token_required

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    errors = validate_user_input(data)
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    users_col = get_users_col()
    email = data.get("email", "").strip().lower()

    if users_col.find_one({"email": email}):
        return jsonify({"error": "An account with this email address already exists"}), 409

    role = data.get("role")
    now = datetime.now(timezone.utc)
    password_hash = generate_password_hash(data.get("password"))

    user_doc = {
        "name": data.get("name", "").strip(),
        "email": email,
        "passwordHash": password_hash,
        "role": role,
        "phone": data.get("phone", "").strip() or "N/A",
        "address": data.get("address", "").strip() or "N/A",
        "createdAt": now,
        "isActive": True
    }

    try:
        result = users_col.insert_one(user_doc)
        user_id = result.inserted_id
        user_doc["_id"] = user_id

        # Role-specific profile initialization
        if role == "ngo":
            org_col = get_organizations_col()
            org_doc = {
                "userId": user_id,
                "organizationName": data.get("organizationName") or user_doc["name"],
                "organizationType": data.get("organizationType") or "Community Shelter",
                "serviceArea": data.get("serviceArea") or user_doc["address"],
                "verificationStatus": "pending",
                "createdAt": now
            }
            org_col.insert_one(org_doc)

        elif role == "volunteer":
            vol_col = get_volunteers_col()
            vol_doc = {
                "userId": user_id,
                "serviceArea": data.get("serviceArea") or "All Zones",
                "availability": "available",
                "transportType": data.get("transportType") or "car",
                "transportCapacityKg": float(data.get("transportCapacityKg") or 20.0),
                "totalDeliveries": 0,
                "totalFoodDeliveredKg": 0.0,
                "totalPoints": 0,
                "badges": [],
                "createdAt": now
            }
            vol_col.insert_one(vol_doc)

        token = generate_token(user_doc)
        safe_user = serialize_doc(user_doc)
        safe_user.pop("passwordHash", None)

        return jsonify({
            "message": "User registration successful",
            "token": token,
            "user": safe_user
        }), 201

    except Exception as e:
        return jsonify({"error": f"Failed to register user: {str(e)}"}), 500

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    users_col = get_users_col()
    user = users_col.find_one({"email": email})

    if not user or not check_password_hash(user.get("passwordHash", ""), password):
        return jsonify({"error": "Invalid email or password"}), 401

    if not user.get("isActive", True):
        return jsonify({"error": "Your account has been deactivated. Please contact support."}), 403

    token = generate_token(user)
    safe_user = serialize_doc(user)
    safe_user.pop("passwordHash", None)

    # Attach profile if exists
    if user.get("role") == "ngo":
        org = get_organizations_col().find_one({"userId": user["_id"]})
        safe_user["organization"] = serialize_doc(org)
    elif user.get("role") == "volunteer":
        vol = get_volunteers_col().find_one({"userId": user["_id"]})
        safe_user["volunteerProfile"] = serialize_doc(vol)

    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": safe_user
    }), 200

@auth_bp.route("/me", methods=["GET"])
@token_required
def me():
    user = request.user
    safe_user = serialize_doc(user)
    safe_user.pop("passwordHash", None)

    if user.get("role") == "ngo":
        org = get_organizations_col().find_one({"userId": user["_id"]})
        safe_user["organization"] = serialize_doc(org)
    elif user.get("role") == "volunteer":
        vol = get_volunteers_col().find_one({"userId": user["_id"]})
        safe_user["volunteerProfile"] = serialize_doc(vol)

    return jsonify({"user": safe_user}), 200

@auth_bp.route("/logout", methods=["POST"])
def logout():
    return jsonify({"message": "Successfully logged out"}), 200
