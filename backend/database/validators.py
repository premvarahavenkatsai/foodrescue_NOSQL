import re
from datetime import datetime
from bson import ObjectId

# ==============================================================================
# MONGODB $jsonSchema VALIDATION DEFINITIONS
# Used to enforce strict schema-level constraints inside MongoDB itself
# ==============================================================================

USERS_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["name", "email", "passwordHash", "role", "phone", "address", "createdAt", "isActive"],
        "properties": {
            "name": {
                "bsonType": "string",
                "minLength": 2,
                "maxLength": 100,
                "description": "User's full name, string between 2 and 100 characters"
            },
            "email": {
                "bsonType": "string",
                "pattern": "^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$",
                "description": "Valid email address string required"
            },
            "passwordHash": {
                "bsonType": "string",
                "minLength": 8,
                "description": "Securely hashed password string"
            },
            "role": {
                "enum": ["donor", "ngo", "volunteer", "admin"],
                "description": "Role must be one of: donor, ngo, volunteer, admin"
            },
            "phone": {
                "bsonType": "string",
                "minLength": 5,
                "description": "Contact telephone number"
            },
            "address": {
                "bsonType": "string",
                "minLength": 3,
                "description": "Physical street address or operating location"
            },
            "createdAt": {
                "bsonType": "date",
                "description": "Registration timestamp"
            },
            "isActive": {
                "bsonType": "bool",
                "description": "Account activation status flag"
            }
        }
    }
}

ORGANIZATIONS_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["userId", "organizationName", "organizationType", "serviceArea", "verificationStatus", "createdAt"],
        "properties": {
            "userId": {
                "bsonType": "objectId",
                "description": "Reference to users._id"
            },
            "organizationName": {
                "bsonType": "string",
                "minLength": 2,
                "maxLength": 150,
                "description": "Registered NGO, Shelter, or Community organization name"
            },
            "organizationType": {
                "bsonType": "string",
                "minLength": 2,
                "description": "Type of organization (e.g. Shelter, Food Bank, Community Kitchen, NGO)"
            },
            "serviceArea": {
                "bsonType": "string",
                "minLength": 2,
                "description": "Geographical coverage or city region"
            },
            "verificationStatus": {
                "enum": ["pending", "verified", "rejected"],
                "description": "Admin verification state"
            },
            "createdAt": {
                "bsonType": "date",
                "description": "Creation timestamp"
            }
        }
    }
}

DONATIONS_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "donorId", "foodName", "category", "quantityKg",
            "preparedAt", "availableUntil", "pickupAddress",
            "dietaryInfo", "status", "createdAt", "updatedAt"
        ],
        "properties": {
            "donorId": {
                "bsonType": "objectId",
                "description": "Reference to donor users._id"
            },
            "foodName": {
                "bsonType": "string",
                "minLength": 2,
                "maxLength": 150,
                "description": "Descriptive title of the food item"
            },
            "category": {
                "enum": [
                    "Cooked Meals",
                    "Bakery & Bread",
                    "Fresh Produce",
                    "Dairy Products",
                    "Packaged Goods",
                    "Beverages",
                    "Other"
                ],
                "description": "Standardized category for food safety and shelf-life tracking"
            },
            "quantityKg": {
                "bsonType": ["double", "int", "decimal"],
                "minimum": 0.1,
                "description": "Weight of surplus food in kilograms (must be strictly greater than 0)"
            },
            "preparedAt": {
                "bsonType": "date",
                "description": "Time when food was cooked or packed"
            },
            "availableUntil": {
                "bsonType": "date",
                "description": "Strict food safety deadline / expiry timestamp"
            },
            "pickupAddress": {
                "bsonType": "string",
                "minLength": 3,
                "description": "Location where volunteer or NGO collects the donation"
            },
            "dietaryInfo": {
                "bsonType": "array",
                "items": {"bsonType": "string"},
                "description": "Dietary markers: Vegetarian, Vegan, Halal, Contains Dairy, Nut-Free, etc."
            },
            "description": {
                "bsonType": "string",
                "description": "Detailed description, packaging type, storage guidance"
            },
            "status": {
                "enum": [
                    "available",
                    "requested",
                    "assigned",
                    "picked_up",
                    "delivered",
                    "expired",
                    "cancelled"
                ],
                "description": "Current lifecycle state of the food donation"
            },
            "createdAt": {"bsonType": "date"},
            "updatedAt": {"bsonType": "date"}
        }
    }
}

DONATION_REQUESTS_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["donationId", "organizationId", "requestedQuantityKg", "status", "requestedAt"],
        "properties": {
            "donationId": {
                "bsonType": "objectId",
                "description": "Reference to donations._id"
            },
            "organizationId": {
                "bsonType": "objectId",
                "description": "Reference to organizations._id"
            },
            "requestedQuantityKg": {
                "bsonType": ["double", "int", "decimal"],
                "minimum": 0.1,
                "description": "Portion or total quantity requested by the NGO"
            },
            "status": {
                "enum": ["pending", "approved", "rejected", "fulfilled", "cancelled"],
                "description": "Status of the donation request"
            },
            "requestedAt": {"bsonType": "date"},
            "reviewedAt": {"bsonType": ["date", "null"]}
        }
    }
}

DELIVERY_TASKS_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "donationId", "requestId", "status",
            "foodQuantityKg", "pointsAwarded", "createdAt"
        ],
        "properties": {
            "donationId": {
                "bsonType": "objectId",
                "description": "Reference to donations._id"
            },
            "requestId": {
                "bsonType": "objectId",
                "description": "Reference to donation_requests._id"
            },
            "volunteerId": {
                "bsonType": ["objectId", "null"],
                "description": "Reference to volunteer users._id (or null if pending pickup)"
            },
            "status": {
                "enum": [
                    "pending_assignment",
                    "accepted",
                    "picked_up",
                    "delivered",
                    "cancelled"
                ],
                "description": "State transition for volunteer delivery workflow"
            },
            "pickedUpAt": {"bsonType": ["date", "null"]},
            "deliveredAt": {"bsonType": ["date", "null"]},
            "foodQuantityKg": {
                "bsonType": ["double", "int", "decimal"],
                "minimum": 0.1,
                "description": "Actual food quantity transported in kilograms"
            },
            "pointsAwarded": {
                "bsonType": "bool",
                "description": "Strict flag ensuring reward points are granted exactly once"
            },
            "createdAt": {"bsonType": "date"}
        }
    }
}

VOLUNTEER_PROFILES_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "userId", "serviceArea", "availability",
            "transportType", "transportCapacityKg",
            "totalDeliveries", "totalFoodDeliveredKg",
            "totalPoints", "badges", "createdAt"
        ],
        "properties": {
            "userId": {
                "bsonType": "objectId",
                "description": "Reference to users._id"
            },
            "serviceArea": {
                "bsonType": "string",
                "minLength": 2,
                "description": "Service neighborhood or radius"
            },
            "availability": {
                "enum": ["available", "busy", "unavailable"],
                "description": "Current availability for rescue tasks"
            },
            "transportType": {
                "enum": ["walking", "bicycle", "motorcycle", "car", "van"],
                "description": "Mode of transportation"
            },
            "transportCapacityKg": {
                "bsonType": ["double", "int", "decimal"],
                "minimum": 0,
                "description": "Maximum payload volunteer can haul"
            },
            "totalDeliveries": {
                "bsonType": ["int", "long"],
                "minimum": 0,
                "description": "Counter of verified completed deliveries"
            },
            "totalFoodDeliveredKg": {
                "bsonType": ["double", "int", "decimal"],
                "minimum": 0,
                "description": "Accumulated verified food transported"
            },
            "totalPoints": {
                "bsonType": ["int", "long"],
                "minimum": 0,
                "description": "Gamified volunteer impact points"
            },
            "badges": {
                "bsonType": "array",
                "items": {"bsonType": "string"},
                "description": "Unlocked badge titles"
            },
            "createdAt": {"bsonType": "date"}
        }
    }
}

SCHEMA_MAP = {
    "users": USERS_SCHEMA,
    "organizations": ORGANIZATIONS_SCHEMA,
    "donations": DONATIONS_SCHEMA,
    "donation_requests": DONATION_REQUESTS_SCHEMA,
    "delivery_tasks": DELIVERY_TASKS_SCHEMA,
    "volunteer_profiles": VOLUNTEER_PROFILES_SCHEMA
}

# ==============================================================================
# APPLICATION-LEVEL VALIDATION HELPERS
# ==============================================================================

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
VALID_ROLES = {"donor", "ngo", "volunteer", "admin"}
VALID_DONATION_CATEGORIES = {
    "Cooked Meals",
    "Bakery & Bread",
    "Fresh Produce",
    "Dairy Products",
    "Packaged Goods",
    "Beverages",
    "Other"
}
VALID_DONATION_STATUSES = {
    "available", "requested", "assigned", "picked_up", "delivered", "expired", "cancelled"
}
VALID_TASK_STATUSES = {
    "pending_assignment", "accepted", "picked_up", "delivered", "cancelled"
}

def validate_user_input(data, is_update=False):
    errors = []
    if not is_update:
        for field in ["name", "email", "password", "role"]:
            if not data.get(field):
                errors.append(f"Missing required field: {field}")

        role = data.get("role")
        if role and role not in VALID_ROLES:
            errors.append(f"Invalid role '{role}'. Allowed: {', '.join(VALID_ROLES)}")

        password = data.get("password")
        if password and len(str(password)) < 6:
            errors.append("Password must be at least 6 characters long")

    email = data.get("email")
    if email and not EMAIL_REGEX.match(email):
        errors.append(f"Invalid email format: {email}")

    return errors

def validate_donation_input(data, is_update=False):
    errors = []
    required = ["foodName", "category", "quantityKg", "availableUntil", "pickupAddress"]
    if not is_update:
        for field in required:
            if data.get(field) is None or str(data.get(field)).strip() == "":
                errors.append(f"Missing required field: {field}")

    category = data.get("category")
    if category and category not in VALID_DONATION_CATEGORIES:
        errors.append(f"Invalid category '{category}'. Allowed: {', '.join(VALID_DONATION_CATEGORIES)}")

    quantity = data.get("quantityKg")
    if quantity is not None:
        try:
            q_val = float(quantity)
            if q_val <= 0:
                errors.append("Donation quantity must be strictly greater than 0 kg")
        except (ValueError, TypeError):
            errors.append("Quantity must be a valid positive number")

    available_until = data.get("availableUntil")
    if available_until:
        try:
            if isinstance(available_until, str):
                dt = datetime.fromisoformat(available_until.replace("Z", "+00:00"))
            elif isinstance(available_until, datetime):
                dt = available_until
            else:
                errors.append("Invalid date format for availableUntil")
        except Exception:
            errors.append("availableUntil must be a valid ISO datetime")

    return errors

def validate_object_id(oid_str, field_name="ID"):
    if not oid_str or not ObjectId.is_valid(str(oid_str)):
        return False, f"Invalid {field_name} format"
    return True, ObjectId(str(oid_str))
