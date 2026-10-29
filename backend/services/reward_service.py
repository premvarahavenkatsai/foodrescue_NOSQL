from datetime import datetime, timezone
from bson import ObjectId
from database.connection import (
    get_deliveries_col,
    get_donations_col,
    get_requests_col,
    get_volunteers_col
)

def calculate_delivery_points(quantity_kg):
    """
    Standard formula: Base 20 points + 2 points per kilogram of rescued food.
    """
    base_points = 20
    kg_points = int(round(float(quantity_kg) * 2))
    return base_points + kg_points

def determine_badges(total_deliveries, total_kg, total_points):
    """
    Evaluates milestone achievements for verified volunteers.
    """
    badges = []
    if total_deliveries >= 1:
        badges.append("First Rescue")
    if total_deliveries >= 5:
        badges.append("Hunger Hero")
    if total_deliveries >= 10:
        badges.append("Super Courier")
    if total_kg >= 100.0:
        badges.append("Century Rescuer")
    if total_points >= 300:
        badges.append("Master Deliverer")
    return badges

def confirm_and_complete_delivery(task_id_str):
    """
    Atomically marks a delivery task as delivered and awards volunteer points exactly once.
    Uses MongoDB atomic find_one_and_update to guarantee concurrency safety and prevent double-spending of points.
    """
    deliveries_col = get_deliveries_col()
    donations_col = get_donations_col()
    requests_col = get_requests_col()
    volunteers_col = get_volunteers_col()

    if not ObjectId.is_valid(task_id_str):
        return False, "Invalid task ID", None

    task_id = ObjectId(task_id_str)
    now = datetime.now(timezone.utc)

    # 1. ATOMIC TASK UPDATE
    # Guarantees that points are awarded ONLY IF pointsAwarded is currently False
    updated_task = deliveries_col.find_one_and_update(
        {
            "_id": task_id,
            "status": {"$in": ["accepted", "picked_up"]},
            "pointsAwarded": False
        },
        {
            "$set": {
                "status": "delivered",
                "deliveredAt": now,
                "pointsAwarded": True
            }
        },
        return_document=True
    )

    if not updated_task:
        # Either the task does not exist, or it has already been delivered / points awarded
        existing = deliveries_col.find_one({"_id": task_id})
        if existing and existing.get("pointsAwarded"):
            return False, "Delivery was already confirmed and points have already been awarded", None
        return False, "Delivery task cannot be completed in its current state", None

    volunteer_id = updated_task.get("volunteerId")
    food_qty = float(updated_task.get("foodQuantityKg", 0.0))
    points_to_award = calculate_delivery_points(food_qty)

    # 2. Update parent donation and request records
    donations_col.update_one(
        {"_id": updated_task["donationId"]},
        {"$set": {"status": "delivered", "updatedAt": now}}
    )
    requests_col.update_one(
        {"_id": updated_task["requestId"]},
        {"$set": {"status": "fulfilled", "reviewedAt": now}}
    )

    # 3. Update volunteer stats atomically if volunteer was assigned
    earned_badges = []
    if volunteer_id:
        v_profile = volunteers_col.find_one_and_update(
            {"userId": volunteer_id},
            {
                "$inc": {
                    "totalDeliveries": 1,
                    "totalFoodDeliveredKg": food_qty,
                    "totalPoints": points_to_award
                }
            },
            return_document=True
        )

        if v_profile:
            earned_badges = determine_badges(
                v_profile.get("totalDeliveries", 0),
                v_profile.get("totalFoodDeliveredKg", 0.0),
                v_profile.get("totalPoints", 0)
            )
            # Add any newly unlocked badges without duplicates
            volunteers_col.update_one(
                {"userId": volunteer_id},
                {"$addToSet": {"badges": {"$each": earned_badges}}}
            )

    return True, "Delivery verified and points awarded successfully", {
        "taskId": str(task_id),
        "pointsAwarded": points_to_award,
        "foodQuantityKg": food_qty,
        "volunteerId": str(volunteer_id) if volunteer_id else None,
        "badges": earned_badges
    }
