import jwt
from functools import wraps
from datetime import datetime, timezone, timedelta
from flask import request, jsonify
from bson import ObjectId
from config import Config
from database.connection import get_users_col

def generate_token(user):
    """
    Generates a secure JWT token containing user identity and role.
    """
    payload = {
        "sub": str(user["_id"]),
        "name": user.get("name"),
        "email": user.get("email"),
        "role": user.get("role"),
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=Config.JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm="HS256")

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Authorization header missing"}), 401

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({"error": "Invalid Authorization header format. Expected 'Bearer <token>'"}), 401

        token = parts[1]
        try:
            payload = jwt.decode(token, Config.JWT_SECRET, algorithms=["HS256"])
            user_id = payload.get("sub")
            if not user_id or not ObjectId.is_valid(user_id):
                return jsonify({"error": "Invalid token subject"}), 401

            user = get_users_col().find_one({"_id": ObjectId(user_id), "isActive": True})
            if not user:
                return jsonify({"error": "User account not found or deactivated"}), 401

            request.user = user
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Authentication token has expired. Please log in again."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid authentication token"}), 401
        except Exception as e:
            return jsonify({"error": f"Authentication failed: {str(e)}"}), 401

        return f(*args, **kwargs)
    return decorated

def role_required(*allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not hasattr(request, "user") or not request.user:
                return jsonify({"error": "Authentication required"}), 401

            user_role = request.user.get("role")
            if user_role not in allowed_roles and "admin" not in allowed_roles and user_role != "admin":
                # Admin can generally access or if specifically required
                if user_role not in allowed_roles:
                    return jsonify({
                        "error": f"Access forbidden. Required role: {', '.join(allowed_roles)}. Your role: {user_role}"
                    }), 403

            return f(*args, **kwargs)
        return decorated
    return decorator
