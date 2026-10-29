import os
import sys
import random
import numpy as np
from datetime import datetime, timezone, timedelta
from bson import ObjectId

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.connection import get_db

FOOD_CATEGORIES = [
    "Cooked Meals",
    "Bakery & Bread",
    "Fresh Produce",
    "Dairy Products",
    "Packaged Food",
    "Beverages"
]

DONOR_TYPES = [
    "Restaurant",
    "Supermarket",
    "Catering Service",
    "Hotel & Banquet",
    "University Dining"
]

TRANSPORT_MODES = [
    "motorcycle",
    "car",
    "van",
    "bicycle"
]

def generate_rescue_records(n_samples=1500, seed=42):
    """
    Generates a realistic, statistically grounded dataset of food rescue operations
    for Machine Learning training and evaluation.
    """
    np.random.seed(seed)
    random.seed(seed)

    records = []
    now = datetime.now(timezone.utc)

    for i in range(n_samples):
        category = random.choice(FOOD_CATEGORIES)
        donor_type = random.choice(DONOR_TYPES)
        transport_mode = random.choice(TRANSPORT_MODES)

        # Quantity depends partially on donor type
        if donor_type in ["Hotel & Banquet", "Catering Service"]:
            quantity_kg = round(float(np.random.uniform(25.0, 120.0)), 1)
        elif donor_type == "Supermarket":
            quantity_kg = round(float(np.random.uniform(15.0, 80.0)), 1)
        else:
            quantity_kg = round(float(np.random.uniform(4.0, 45.0)), 1)

        # Shelf life depends on food category
        if category == "Cooked Meals":
            shelf_life_hours = round(float(np.random.uniform(2.0, 10.0)), 1)
            storage_temp = round(float(np.random.uniform(55.0, 68.0) if random.random() > 0.5 else np.random.uniform(4.0, 10.0)), 1)
        elif category == "Dairy Products":
            shelf_life_hours = round(float(np.random.uniform(8.0, 36.0)), 1)
            storage_temp = round(float(np.random.uniform(2.0, 8.0)), 1)
        elif category == "Bakery & Bread":
            shelf_life_hours = round(float(np.random.uniform(12.0, 36.0)), 1)
            storage_temp = round(float(np.random.uniform(18.0, 26.0)), 1)
        elif category == "Fresh Produce":
            shelf_life_hours = round(float(np.random.uniform(24.0, 72.0)), 1)
            storage_temp = round(float(np.random.uniform(10.0, 22.0)), 1)
        else:
            shelf_life_hours = round(float(np.random.uniform(36.0, 120.0)), 1)
            storage_temp = round(float(np.random.uniform(15.0, 25.0)), 1)

        distance_km = round(float(np.random.uniform(1.2, 28.0)), 1)
        hour_probs = np.array([
            0.01, 0.01, 0.01, 0.01, 0.02, 0.03,
            0.04, 0.05, 0.06, 0.06, 0.07, 0.08,
            0.10, 0.09, 0.07, 0.05, 0.04, 0.04,
            0.05, 0.07, 0.08, 0.04, 0.02, 0.01
        ])
        hour_probs = hour_probs / hour_probs.sum()
        prep_hour = int(np.random.choice(range(24), p=hour_probs))
        is_weekend = int(random.random() < 0.28)

        # Logit for classification: claim success probability
        # Higher shelf life, lower distance, standard prep hours -> higher success
        z_claim = (
            0.85
            + (shelf_life_hours * 0.08)
            - (distance_km * 0.09)
            - (0.015 * quantity_kg)
            + (0.3 if prep_hour in range(11, 21) else -0.4)
            - (0.2 if is_weekend else 0.0)
            + np.random.normal(0, 0.35)
        )
        claim_prob = 1.0 / (1.0 + np.exp(-z_claim))
        claim_success = 1 if claim_prob >= 0.50 else 0

        # Continuous target for regression: Delivery & fulfillment time (minutes)
        # Highly influenced by distance, transport mode, quantity, traffic during peak hours
        peak_traffic = 15.0 if (prep_hour in [8, 9, 10, 17, 18, 19, 20]) else 0.0
        mode_speed_factor = {"motorcycle": 1.1, "car": 1.5, "van": 1.8, "bicycle": 2.2}[transport_mode]
        base_delivery_time = 12.0 + (distance_km * 2.8 * mode_speed_factor) + (quantity_kg * 0.15) + peak_traffic
        delivery_time_mins = round(float(base_delivery_time + np.random.normal(0, 4.5)), 1)
        delivery_time_mins = max(15.0, delivery_time_mins)

        # Rescued quantity target (regression)
        if claim_success == 1:
            rescued_quantity_kg = round(float(quantity_kg * np.random.uniform(0.85, 1.0)), 1)
        else:
            rescued_quantity_kg = 0.0

        days_ago = random.randint(1, 90)
        created_at = now - timedelta(days=days_ago, hours=random.randint(0, 23))

        record = {
            "_id": ObjectId(),
            "recordId": f"ML-REC-{i+1001:05d}",
            "foodCategory": category,
            "donorType": donor_type,
            "transportMode": transport_mode,
            "quantityKg": quantity_kg,
            "shelfLifeHours": shelf_life_hours,
            "prepHour": prep_hour,
            "distanceKm": distance_km,
            "storageTempCelsius": storage_temp,
            "isWeekend": is_weekend,
            "claimSuccess": claim_success,
            "claimProbabilityScore": round(float(claim_prob), 4),
            "deliveryTimeMinutes": delivery_time_mins,
            "rescuedQuantityKg": rescued_quantity_kg,
            "createdAt": created_at,
            "source": "historical_log"
        }
        records.append(record)

    return records

def seed_ml_dataset_to_mongodb(n_samples=1500):
    """
    Seeds the generated ML dataset into MongoDB collection 'ml_rescue_records' via PyMongo.
    """
    db = get_db()
    col = db["ml_rescue_records"]
    col.delete_many({})

    records = generate_rescue_records(n_samples=n_samples)
    result = col.insert_many(records)
    print(f"[SUCCESS] Inserted {len(result.inserted_ids)} ML rescue training records into MongoDB collection 'ml_rescue_records'.")
    return len(result.inserted_ids)

if __name__ == "__main__":
    count = seed_ml_dataset_to_mongodb()
    print(f"Finished seeding {count} records into MongoDB.")
