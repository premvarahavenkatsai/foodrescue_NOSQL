import sys
import os
from datetime import datetime, timezone, timedelta
from werkzeug.security import generate_password_hash
from bson import ObjectId

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import get_db

def seed_database():
    db = get_db()
    print(f"🌱 Seeding Indian sample data into '{db.name}'...")

    # Clear existing data
    db.users.delete_many({})
    db.organizations.delete_many({})
    db.donations.delete_many({})
    db.donation_requests.delete_many({})
    db.delivery_tasks.delete_many({})
    db.volunteer_profiles.delete_many({})

    now = datetime.now(timezone.utc)
    hashed_password = generate_password_hash("password123")

    # ==========================================================================
    # 1. USERS (INDIAN IDENTITIES)
    # ==========================================================================
    admin_id = ObjectId()
    donor1_id = ObjectId()
    donor2_id = ObjectId()
    donor3_id = ObjectId()
    ngo1_user_id = ObjectId()
    ngo2_user_id = ObjectId()
    ngo3_user_id = ObjectId()
    vol1_id = ObjectId()
    vol2_id = ObjectId()
    vol3_id = ObjectId()
    vol4_id = ObjectId()

    users = [
        {
            "_id": admin_id,
            "name": "Vikram Malhotra (Admin)",
            "email": "admin@foodrescue.org",
            "passwordHash": hashed_password,
            "role": "admin",
            "phone": "+91-98100-11223",
            "address": "102, Connaught Place, New Delhi",
            "createdAt": now - timedelta(days=60),
            "isActive": True
        },
        # Donors
        {
            "_id": donor1_id,
            "name": "Annapurna Grand Restaurant",
            "email": "donor1@annapurna.in",
            "passwordHash": hashed_password,
            "role": "donor",
            "phone": "+91-98490-12345",
            "address": "45, MG Road, Indiranagar, Bengaluru",
            "createdAt": now - timedelta(days=45),
            "isActive": True
        },
        {
            "_id": donor2_id,
            "name": "Campus Central Dining Hall (IIT Campus)",
            "email": "donor2@campusdining.edu.in",
            "passwordHash": hashed_password,
            "role": "donor",
            "phone": "+91-98201-23456",
            "address": "Hostel Mess Block 4, IIT Powai, Mumbai",
            "createdAt": now - timedelta(days=30),
            "isActive": True
        },
        {
            "_id": donor3_id,
            "name": "Bawarchi & Royal Banquet Caterers",
            "email": "donor3@royalbanquets.in",
            "passwordHash": hashed_password,
            "role": "donor",
            "phone": "+91-98765-34567",
            "address": "12, Banjara Hills Road No. 1, Hyderabad",
            "createdAt": now - timedelta(days=20),
            "isActive": True
        },
        # NGOs / Shelters
        {
            "_id": ngo1_user_id,
            "name": "Roti Bank Seva Trust",
            "email": "ngo1@rotibank.org",
            "passwordHash": hashed_password,
            "role": "ngo",
            "phone": "+91-98111-45678",
            "address": "88, Seva Kendra Marg, Shivajinagar, Bengaluru",
            "createdAt": now - timedelta(days=40),
            "isActive": True
        },
        {
            "_id": ngo2_user_id,
            "name": "Akshaya Aahar Night Shelter",
            "email": "ngo2@akshayashelter.org",
            "passwordHash": hashed_password,
            "role": "ngo",
            "phone": "+91-98222-56789",
            "address": "104, Station Road, Dadar West, Mumbai",
            "createdAt": now - timedelta(days=25),
            "isActive": True
        },
        {
            "_id": ngo3_user_id,
            "name": "Annakshetra Youth Foundation",
            "email": "ngo3@annakshetra.org",
            "passwordHash": hashed_password,
            "role": "ngo",
            "phone": "+91-98333-67890",
            "address": "23, Sultan Bazar, Koti, Hyderabad",
            "createdAt": now - timedelta(days=5),
            "isActive": True
        },
        # Volunteer Couriers
        {
            "_id": vol1_id,
            "name": "Aarav Sharma",
            "email": "volunteer1@foodrescue.org",
            "passwordHash": hashed_password,
            "role": "volunteer",
            "phone": "+91-98450-78901",
            "address": "14, 5th Cross, Koramangala, Bengaluru",
            "createdAt": now - timedelta(days=35),
            "isActive": True
        },
        {
            "_id": vol2_id,
            "name": "Rohan Verma",
            "email": "volunteer2@foodrescue.org",
            "passwordHash": hashed_password,
            "role": "volunteer",
            "phone": "+91-98660-89012",
            "address": "52, Bandra Kurla Complex, Mumbai",
            "createdAt": now - timedelta(days=25),
            "isActive": True
        },
        {
            "_id": vol3_id,
            "name": "Sneha Kulkarni",
            "email": "volunteer3@foodrescue.org",
            "passwordHash": hashed_password,
            "role": "volunteer",
            "phone": "+91-98770-90123",
            "address": "71, Jubilee Hills, Hyderabad",
            "createdAt": now - timedelta(days=15),
            "isActive": True
        },
        {
            "_id": vol4_id,
            "name": "Aditya Reddy",
            "email": "volunteer4@foodrescue.org",
            "passwordHash": hashed_password,
            "role": "volunteer",
            "phone": "+91-98880-01234",
            "address": "9, Gachibowli Ring Road, Hyderabad",
            "createdAt": now - timedelta(days=3),
            "isActive": True
        }
    ]
    db.users.insert_many(users)
    print(f"  ✅ Inserted {len(users)} Indian users.")

    # ==========================================================================
    # 2. ORGANIZATIONS (INDIAN SHELTERS & RO TI BANKS)
    # ==========================================================================
    ngo1_org_id = ObjectId()
    ngo2_org_id = ObjectId()
    ngo3_org_id = ObjectId()

    organizations = [
        {
            "_id": ngo1_org_id,
            "userId": ngo1_user_id,
            "organizationName": "Roti Bank Seva Trust",
            "organizationType": "Community Kitchen & Food Pantry",
            "serviceArea": "Indiranagar & East Bengaluru",
            "verificationStatus": "verified",
            "createdAt": now - timedelta(days=40)
        },
        {
            "_id": ngo2_org_id,
            "userId": ngo2_user_id,
            "organizationName": "Akshaya Aahar Night Shelter",
            "organizationType": "Emergency Homeless Shelter & Kitchen",
            "serviceArea": "Dadar & Central Mumbai",
            "verificationStatus": "verified",
            "createdAt": now - timedelta(days=25)
        },
        {
            "_id": ngo3_org_id,
            "userId": ngo3_user_id,
            "organizationName": "Annakshetra Youth Foundation",
            "organizationType": "Youth Support & Nutrition Centre",
            "serviceArea": "Old City & Charminar, Hyderabad",
            "verificationStatus": "pending",
            "createdAt": now - timedelta(days=5)
        }
    ]
    db.organizations.insert_many(organizations)
    print(f"  ✅ Inserted {len(organizations)} Indian organizations.")

    # ==========================================================================
    # 3. VOLUNTEER PROFILES
    # ==========================================================================
    volunteer_profiles = [
        {
            "userId": vol1_id,
            "serviceArea": "Indiranagar & Koramangala, Bengaluru",
            "availability": "available",
            "transportType": "car",
            "transportCapacityKg": 50.0,
            "totalDeliveries": 8,
            "totalFoodDeliveredKg": 165.0,
            "totalPoints": 240,
            "badges": ["First Rescue", "Hunger Hero", "Super Courier", "Century Rescuer"],
            "createdAt": now - timedelta(days=35)
        },
        {
            "userId": vol2_id,
            "serviceArea": "Bandra & Dadar, Mumbai",
            "availability": "busy",
            "transportType": "motorcycle",
            "transportCapacityKg": 25.0,
            "totalDeliveries": 5,
            "totalFoodDeliveredKg": 82.5,
            "totalPoints": 150,
            "badges": ["First Rescue", "Hunger Hero"],
            "createdAt": now - timedelta(days=25)
        },
        {
            "userId": vol3_id,
            "serviceArea": "Banjara Hills & Jubilee Hills, Hyderabad",
            "availability": "available",
            "transportType": "bicycle",
            "transportCapacityKg": 15.0,
            "totalDeliveries": 2,
            "totalFoodDeliveredKg": 24.0,
            "totalPoints": 60,
            "badges": ["First Rescue"],
            "createdAt": now - timedelta(days=15)
        },
        {
            "userId": vol4_id,
            "serviceArea": "Hitec City & Gachibowli, Hyderabad",
            "availability": "available",
            "transportType": "van",
            "transportCapacityKg": 150.0,
            "totalDeliveries": 0,
            "totalFoodDeliveredKg": 0.0,
            "totalPoints": 0,
            "badges": [],
            "createdAt": now - timedelta(days=3)
        }
    ]
    db.volunteer_profiles.insert_many(volunteer_profiles)
    print(f"  ✅ Inserted {len(volunteer_profiles)} volunteer profiles.")

    # ==========================================================================
    # 4. COMPLETED HISTORICAL DONATIONS & DELIVERIES (INDIAN FOOD RESCUES)
    # ==========================================================================
    h_donations = [
        {
            "_id": ObjectId(),
            "donorId": donor1_id,
            "foodName": "Hyderabadi Vegetable Dum Biryani & Mirchi Ka Salan",
            "category": "Cooked Meals",
            "quantityKg": 25.0,
            "preparedAt": now - timedelta(days=12, hours=3),
            "availableUntil": now - timedelta(days=11, hours=20),
            "pickupAddress": "45, MG Road, Indiranagar, Bengaluru",
            "dietaryInfo": ["Pure Vegetarian", "Halal Certified"],
            "description": "50 large foil containers of fragrant vegetable basmati biryani with spicy salan.",
            "status": "delivered",
            "createdAt": now - timedelta(days=12, hours=4),
            "updatedAt": now - timedelta(days=12)
        },
        {
            "_id": ObjectId(),
            "donorId": donor3_id,
            "foodName": "Fresh Tawa Rotis & Butter Naan",
            "category": "Bakery & Bread",
            "quantityKg": 18.5,
            "preparedAt": now - timedelta(days=8, hours=5),
            "availableUntil": now - timedelta(days=7),
            "pickupAddress": "12, Banjara Hills Road No. 1, Hyderabad",
            "dietaryInfo": ["Pure Vegetarian", "Jain Friendly"],
            "description": "Freshly made whole wheat rotis and soft tandoori naans packed in thermal food boxes.",
            "status": "delivered",
            "createdAt": now - timedelta(days=8, hours=6),
            "updatedAt": now - timedelta(days=8, hours=1)
        },
        {
            "_id": ObjectId(),
            "donorId": donor2_id,
            "foodName": "Fresh Shimla Apples & Nagpur Oranges",
            "category": "Fresh Produce",
            "quantityKg": 40.0,
            "preparedAt": now - timedelta(days=5, hours=2),
            "availableUntil": now - timedelta(days=3),
            "pickupAddress": "Hostel Mess Block 4, IIT Powai, Mumbai",
            "dietaryInfo": ["Pure Vegetarian", "Organic"],
            "description": "Crisp seasonal fruit packed in 4 ventilated wooden crates from campus dining.",
            "status": "delivered",
            "createdAt": now - timedelta(days=5, hours=3),
            "updatedAt": now - timedelta(days=5)
        },
        {
            "_id": ObjectId(),
            "donorId": donor1_id,
            "foodName": "Amul Pasteurized Milk & Fresh Curd (Dahi)",
            "category": "Dairy Products",
            "quantityKg": 15.0,
            "preparedAt": now - timedelta(days=2, hours=8),
            "availableUntil": now - timedelta(days=1, hours=12),
            "pickupAddress": "45, MG Road, Indiranagar, Bengaluru",
            "dietaryInfo": ["Contains Dairy", "Pure Vegetarian"],
            "description": "Chilled sealed pouches of Amul Taaza milk and fresh homestyle curd kept refrigerated at 4°C.",
            "status": "delivered",
            "createdAt": now - timedelta(days=2, hours=9),
            "updatedAt": now - timedelta(days=2, hours=4)
        }
    ]
    db.donations.insert_many(h_donations)

    vols = [vol1_id, vol2_id, vol1_id, vol3_id]
    ngos = [ngo1_org_id, ngo2_org_id, ngo1_org_id, ngo2_org_id]

    for idx, d in enumerate(h_donations):
        req_id = ObjectId()
        db.donation_requests.insert_one({
            "_id": req_id,
            "donationId": d["_id"],
            "organizationId": ngos[idx],
            "requestedQuantityKg": d["quantityKg"],
            "status": "fulfilled",
            "requestedAt": d["createdAt"] + timedelta(minutes=20),
            "reviewedAt": d["createdAt"] + timedelta(minutes=45)
        })

        db.delivery_tasks.insert_one({
            "_id": ObjectId(),
            "donationId": d["_id"],
            "requestId": req_id,
            "volunteerId": vols[idx],
            "status": "delivered",
            "pickedUpAt": d["createdAt"] + timedelta(hours=1),
            "deliveredAt": d["createdAt"] + timedelta(hours=2),
            "foodQuantityKg": d["quantityKg"],
            "pointsAwarded": True,
            "createdAt": d["createdAt"] + timedelta(minutes=50)
        })

    # ==========================================================================
    # 5. ACTIVE & IN-PROGRESS INDIAN DONATIONS
    # ==========================================================================
    # A) In-progress donation: Picked up by Aarav Sharma, en route to Roti Bank
    ip_don1_id = ObjectId()
    ip_req1_id = ObjectId()
    db.donations.insert_one({
        "_id": ip_don1_id,
        "donorId": donor1_id,
        "foodName": "Dal Makhani, Shahi Paneer & Jeera Rice",
        "category": "Cooked Meals",
        "quantityKg": 16.0,
        "preparedAt": now - timedelta(hours=2),
        "availableUntil": now + timedelta(hours=6),
        "pickupAddress": "45, MG Road, Indiranagar, Bengaluru",
        "dietaryInfo": ["Pure Vegetarian", "North Indian"],
        "description": "Insulated stainless steel containers with rich dal makhani, shahi paneer and jeera rice.",
        "status": "picked_up",
        "createdAt": now - timedelta(hours=3),
        "updatedAt": now - timedelta(minutes=30)
    })
    db.donation_requests.insert_one({
        "_id": ip_req1_id,
        "donationId": ip_don1_id,
        "organizationId": ngo1_org_id,
        "requestedQuantityKg": 16.0,
        "status": "approved",
        "requestedAt": now - timedelta(hours=2, minutes=30),
        "reviewedAt": now - timedelta(hours=2)
    })
    db.delivery_tasks.insert_one({
        "_id": ObjectId(),
        "donationId": ip_don1_id,
        "requestId": ip_req1_id,
        "volunteerId": vol1_id,
        "status": "picked_up",
        "pickedUpAt": now - timedelta(minutes=30),
        "deliveredAt": None,
        "foodQuantityKg": 16.0,
        "pointsAwarded": False,
        "createdAt": now - timedelta(hours=1, minutes=45)
    })

    # B) In-progress donation: Accepted by Rohan Verma, en route to Akshaya Aahar
    ip_don2_id = ObjectId()
    ip_req2_id = ObjectId()
    db.donations.insert_one({
        "_id": ip_don2_id,
        "donorId": donor2_id,
        "foodName": "Idli, Medu Vada, Sambar & Coconut Chutney",
        "category": "Cooked Meals",
        "quantityKg": 22.0,
        "preparedAt": now - timedelta(hours=1),
        "availableUntil": now + timedelta(hours=5),
        "pickupAddress": "Hostel Mess Block 4, IIT Powai, Mumbai",
        "dietaryInfo": ["Pure Vegetarian", "South Indian", "Jain Friendly"],
        "description": "Fresh morning breakfast batch of steamed idlis, crispy medu vadas, and hot sambar.",
        "status": "assigned",
        "createdAt": now - timedelta(hours=2),
        "updatedAt": now - timedelta(minutes=15)
    })
    db.donation_requests.insert_one({
        "_id": ip_req2_id,
        "donationId": ip_don2_id,
        "organizationId": ngo2_org_id,
        "requestedQuantityKg": 22.0,
        "status": "approved",
        "requestedAt": now - timedelta(hours=1, minutes=30),
        "reviewedAt": now - timedelta(hours=1)
    })
    db.delivery_tasks.insert_one({
        "_id": ObjectId(),
        "donationId": ip_don2_id,
        "requestId": ip_req2_id,
        "volunteerId": vol2_id,
        "status": "accepted",
        "pickedUpAt": None,
        "deliveredAt": None,
        "foodQuantityKg": 22.0,
        "pointsAwarded": False,
        "createdAt": now - timedelta(minutes=40)
    })

    # C) Donation requested by NGO, waiting for Volunteer (pending assignment)
    ip_don3_id = ObjectId()
    ip_req3_id = ObjectId()
    db.donations.insert_one({
        "_id": ip_don3_id,
        "donorId": donor3_id,
        "foodName": "Mumbai Ladi Pav & Fresh Whole Wheat Buns",
        "category": "Bakery & Bread",
        "quantityKg": 14.0,
        "preparedAt": now - timedelta(hours=3),
        "availableUntil": now + timedelta(hours=10),
        "pickupAddress": "12, Banjara Hills Road No. 1, Hyderabad",
        "dietaryInfo": ["Pure Vegetarian", "Eggless"],
        "description": "Fresh evening surplus bakery batch of soft ladi pav and buns in clean carry crates.",
        "status": "requested",
        "createdAt": now - timedelta(hours=3),
        "updatedAt": now - timedelta(hours=1)
    })
    db.donation_requests.insert_one({
        "_id": ip_req3_id,
        "donationId": ip_don3_id,
        "organizationId": ngo1_org_id,
        "requestedQuantityKg": 14.0,
        "status": "approved",
        "requestedAt": now - timedelta(hours=2),
        "reviewedAt": now - timedelta(hours=1, minutes=30)
    })
    db.delivery_tasks.insert_one({
        "_id": ObjectId(),
        "donationId": ip_don3_id,
        "requestId": ip_req3_id,
        "volunteerId": None,
        "status": "pending_assignment",
        "pickedUpAt": None,
        "deliveredAt": None,
        "foodQuantityKg": 14.0,
        "pointsAwarded": False,
        "createdAt": now - timedelta(hours=1, minutes=30)
    })

    # ==========================================================================
    # 6. AVAILABLE INDIAN DONATIONS (Open for NGO requests)
    # ==========================================================================
    available_donations = [
        {
            "donorId": donor2_id,
            "foodName": "Organic Palak, Methi Greens & Desi Tomatoes",
            "category": "Fresh Produce",
            "quantityKg": 32.0,
            "preparedAt": now - timedelta(hours=4),
            "availableUntil": now + timedelta(days=2),
            "pickupAddress": "Hostel Mess Block 4, IIT Powai, Mumbai",
            "dietaryInfo": ["Pure Vegetarian", "Organic"],
            "description": "Fresh unbruised leafy vegetables and farm tomatoes harvested this morning.",
            "status": "available",
            "createdAt": now - timedelta(hours=4),
            "updatedAt": now - timedelta(hours=4)
        },
        {
            "donorId": donor1_id,
            "foodName": "Fortune Basmati Rice & Tata Sampann Toor Dal Packs",
            "category": "Packaged Goods",
            "quantityKg": 50.0,
            "preparedAt": now - timedelta(days=1),
            "availableUntil": now + timedelta(days=14),
            "pickupAddress": "45, MG Road, Indiranagar, Bengaluru",
            "dietaryInfo": ["Pure Vegetarian", "Shelf-Stable"],
            "description": "Sealed commercial food service bags of 1121 basmati rice and unpolished toor dal.",
            "status": "available",
            "createdAt": now - timedelta(hours=5),
            "updatedAt": now - timedelta(hours=5)
        },
        {
            "donorId": donor3_id,
            "foodName": "Gulab Jamun & Besan Ladoos (Sweet Box Surplus)",
            "category": "Bakery & Bread",
            "quantityKg": 12.0,
            "preparedAt": now - timedelta(hours=2),
            "availableUntil": now + timedelta(hours=18),
            "pickupAddress": "12, Banjara Hills Road No. 1, Hyderabad",
            "dietaryInfo": ["Pure Vegetarian", "Desi Ghee"],
            "description": "Fresh festival sweet boxes packed in hygienic air-tight gift containers.",
            "status": "available",
            "createdAt": now - timedelta(hours=2),
            "updatedAt": now - timedelta(hours=2)
        },
        {
            "donorId": donor1_id,
            "foodName": "Fresh Masala Buttermilk (Chaas) & Mango Lassi",
            "category": "Beverages",
            "quantityKg": 20.0,
            "preparedAt": now - timedelta(hours=6),
            "availableUntil": now + timedelta(days=1),
            "pickupAddress": "45, MG Road, Indiranagar, Bengaluru",
            "dietaryInfo": ["Pure Vegetarian", "Contains Dairy"],
            "description": "Chilled bottles of refreshing cumin spiced chaas and sweet mango lassi in ice boxes.",
            "status": "available",
            "createdAt": now - timedelta(hours=6),
            "updatedAt": now - timedelta(hours=6)
        }
    ]
    db.donations.insert_many(available_donations)

    print(f"  ✅ Inserted {len(h_donations) + 3 + len(available_donations)} total donations.")
    print(f"  ✅ Inserted donation requests and delivery tasks.")
    print(f"\n🎉 Database '{db.name}' successfully seeded with realistic Indian sample data!")

if __name__ == "__main__":
    seed_database()
