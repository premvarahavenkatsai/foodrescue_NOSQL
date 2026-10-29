import sys
import os

# Add parent directory to sys.path so config and database modules can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import get_db
from database.validators import SCHEMA_MAP
from pymongo import ASCENDING, DESCENDING

def initialize_database(db_name=None):
    """
    Initializes collections with MongoDB $jsonSchema validators and performance indexes.
    """
    db = get_db(db_name)
    existing_collections = db.list_collection_names()

    print(f"[INIT] Initializing MongoDB database '{db.name}' with $jsonSchema validation...")

    for col_name, schema in SCHEMA_MAP.items():
        if col_name not in existing_collections:
            try:
                db.create_collection(
                    col_name,
                    validator=schema,
                    validationLevel="strict",
                    validationAction="error"
                )
                print(f"  [OK] Created collection '{col_name}' with strict $jsonSchema validator.")
            except Exception as e:
                print(f"  [ERR] Failed to create '{col_name}': {e}")
        else:
            try:
                db.command({
                    "collMod": col_name,
                    "validator": schema,
                    "validationLevel": "strict",
                    "validationAction": "error"
                })
                print(f"  [OK] Updated strict $jsonSchema validator for '{col_name}'.")
            except Exception as e:
                print(f"  [WARN] Could not update validator for '{col_name}': {e}")

    print("\n[INDEX] Configuring MongoDB Indexes...")

    # 1. users indexes
    db.users.create_index([("email", ASCENDING)], unique=True, name="idx_users_email_unique")
    db.users.create_index([("role", ASCENDING)], name="idx_users_role")
    print("  [OK] users: Created unique email index & role index")

    # 2. organizations indexes
    db.organizations.create_index([("userId", ASCENDING)], unique=True, name="idx_org_user_id_unique")
    db.organizations.create_index([("verificationStatus", ASCENDING)], name="idx_org_verification_status")
    print("  [OK] organizations: Created userId and verificationStatus indexes")

    # 3. donations indexes
    db.donations.create_index([("donorId", ASCENDING)], name="idx_donations_donor_id")
    db.donations.create_index([("status", ASCENDING)], name="idx_donations_status")
    db.donations.create_index([("availableUntil", ASCENDING)], name="idx_donations_expiry")
    db.donations.create_index([("status", ASCENDING), ("availableUntil", ASCENDING)], name="idx_donations_status_expiry")
    db.donations.create_index([("category", ASCENDING)], name="idx_donations_category")
    print("  [OK] donations: Created donorId, status, availableUntil, category indexes")

    # 4. donation_requests indexes
    db.donation_requests.create_index([("donationId", ASCENDING)], name="idx_requests_donation_id")
    db.donation_requests.create_index([("organizationId", ASCENDING)], name="idx_requests_org_id")
    db.donation_requests.create_index([("status", ASCENDING)], name="idx_requests_status")
    db.donation_requests.create_index([("donationId", ASCENDING), ("organizationId", ASCENDING)], name="idx_requests_donation_org")
    print("  [OK] donation_requests: Created donationId, organizationId, status indexes")

    # 5. delivery_tasks indexes
    db.delivery_tasks.create_index([("donationId", ASCENDING)], name="idx_tasks_donation_id")
    db.delivery_tasks.create_index([("requestId", ASCENDING)], name="idx_tasks_request_id")
    db.delivery_tasks.create_index([("volunteerId", ASCENDING)], name="idx_tasks_volunteer_id")
    db.delivery_tasks.create_index([("status", ASCENDING)], name="idx_tasks_status")
    db.delivery_tasks.create_index([("pointsAwarded", ASCENDING)], name="idx_tasks_points_awarded")
    print("  [OK] delivery_tasks: Created donationId, volunteerId, status, pointsAwarded indexes")

    # 6. volunteer_profiles indexes
    db.volunteer_profiles.create_index([("userId", ASCENDING)], unique=True, name="idx_volunteer_user_id_unique")
    db.volunteer_profiles.create_index([("availability", ASCENDING)], name="idx_volunteer_availability")
    db.volunteer_profiles.create_index([("totalPoints", DESCENDING)], name="idx_volunteer_leaderboard_points")
    print("  [OK] volunteer_profiles: Created userId, availability, and leaderboard points indexes")

    print(f"\n[SUCCESS] Database '{db.name}' initialization completed successfully!\n")

if __name__ == "__main__":
    initialize_database()
