from database.connection import (
    get_deliveries_col,
    get_donations_col,
    get_requests_col,
    get_volunteers_col,
    get_users_col,
    get_organizations_col,
    serialize_doc
)

def get_rescued_food_trend(group_by="day"):
    """
    Aggregation Pipeline 1:
    Total food rescued, in kilograms, grouped by day or month.
    STRICT FOOD RESCUE DEFINITION:
    Only includes verified completed deliveries where pointsAwarded is True and status is 'delivered'.
    Excludes cancelled, expired, uncollected, or unverified donations.
    """
    deliveries_col = get_deliveries_col()
    date_format = "%Y-%m-%d" if group_by == "day" else "%Y-%m"

    pipeline = [
        {
            "$match": {
                "status": "delivered",
                "pointsAwarded": True,
                "deliveredAt": {"$ne": None}
            }
        },
        {
            "$project": {
                "period": {
                    "$dateToString": {
                        "format": date_format,
                        "date": "$deliveredAt"
                    }
                },
                "foodQuantityKg": "$foodQuantityKg"
            }
        },
        {
            "$group": {
                "_id": "$period",
                "totalRescuedKg": {"$sum": "$foodQuantityKg"},
                "deliveryCount": {"$sum": 1}
            }
        },
        {
            "$sort": {"_id": 1}
        },
        {
            "$project": {
                "_id": 0,
                "period": "$_id",
                "totalRescuedKg": {"$round": ["$totalRescuedKg", 2]},
                "deliveryCount": 1
            }
        }
    ]

    return list(deliveries_col.aggregate(pipeline))

def get_food_donated_by_donor():
    """
    Aggregation Pipeline 2:
    Food donated by each donor, calculating total kg and number of listings.
    Uses $lookup and $unwind to join with users collection.
    """
    donations_col = get_donations_col()

    pipeline = [
        {
            "$match": {
                "status": {"$nin": ["cancelled"]}
            }
        },
        {
            "$group": {
                "_id": "$donorId",
                "totalDonatedKg": {"$sum": "$quantityKg"},
                "donationsCount": {"$sum": 1},
                "completedRescues": {
                    "$sum": {"$cond": [{"$eq": ["$status", "delivered"]}, 1, 0]}
                }
            }
        },
        {
            "$lookup": {
                "from": "users",
                "localField": "_id",
                "foreignField": "_id",
                "as": "donor"
            }
        },
        {
            "$unwind": "$donor"
        },
        {
            "$project": {
                "_id": 0,
                "donorId": {"$toString": "$_id"},
                "donorName": "$donor.name",
                "donorEmail": "$donor.email",
                "donorAddress": "$donor.address",
                "totalDonatedKg": {"$round": ["$totalDonatedKg", 2]},
                "donationsCount": 1,
                "completedRescues": 1
            }
        },
        {
            "$sort": {"totalDonatedKg": -1}
        }
    ]

    return list(donations_col.aggregate(pipeline))

def get_top_volunteers(limit=10):
    """
    Aggregation Pipeline 3:
    Top volunteers ranked by verified completed deliveries and earned points.
    Includes profile badges, transport type, and delivery metrics.
    """
    volunteers_col = get_volunteers_col()

    pipeline = [
        {
            "$lookup": {
                "from": "users",
                "localField": "userId",
                "foreignField": "_id",
                "as": "user"
            }
        },
        {
            "$unwind": "$user"
        },
        {
            "$project": {
                "_id": 0,
                "volunteerId": {"$toString": "$userId"},
                "name": "$user.name",
                "email": "$user.email",
                "transportType": "$transportType",
                "transportCapacityKg": "$transportCapacityKg",
                "totalDeliveries": "$totalDeliveries",
                "totalFoodDeliveredKg": {"$round": ["$totalFoodDeliveredKg", 2]},
                "totalPoints": "$totalPoints",
                "badges": "$badges"
            }
        },
        {
            "$sort": {
                "totalPoints": -1,
                "totalDeliveries": -1,
                "totalFoodDeliveredKg": -1
            }
        },
        {
            "$limit": limit
        }
    ]

    results = list(volunteers_col.aggregate(pipeline))
    for rank, item in enumerate(results, start=1):
        item["rank"] = rank
    return results

def get_volunteer_delivery_stats():
    """
    Aggregation Pipeline 4:
    Total food delivered by each volunteer computed directly from verified delivery tasks.
    """
    deliveries_col = get_deliveries_col()

    pipeline = [
        {
            "$match": {
                "status": "delivered",
                "pointsAwarded": True,
                "volunteerId": {"$ne": None}
            }
        },
        {
            "$group": {
                "_id": "$volunteerId",
                "verifiedFoodDeliveredKg": {"$sum": "$foodQuantityKg"},
                "verifiedDeliveriesCount": {"$sum": 1}
            }
        },
        {
            "$lookup": {
                "from": "users",
                "localField": "_id",
                "foreignField": "_id",
                "as": "user"
            }
        },
        {
            "$unwind": "$user"
        },
        {
            "$project": {
                "_id": 0,
                "volunteerId": {"$toString": "$_id"},
                "volunteerName": "$user.name",
                "verifiedFoodDeliveredKg": {"$round": ["$verifiedFoodDeliveredKg", 2]},
                "verifiedDeliveriesCount": 1
            }
        },
        {
            "$sort": {"verifiedFoodDeliveredKg": -1}
        }
    ]

    return list(deliveries_col.aggregate(pipeline))

def get_donations_by_category_and_status():
    """
    Aggregation Pipeline 5:
    Donation counts and kilograms grouped by food category and status.
    """
    donations_col = get_donations_col()

    pipeline = [
        {
            "$group": {
                "_id": {
                    "category": "$category",
                    "status": "$status"
                },
                "count": {"$sum": 1},
                "totalQuantityKg": {"$sum": "$quantityKg"}
            }
        },
        {
            "$project": {
                "_id": 0,
                "category": "$_id.category",
                "status": "$_id.status",
                "count": 1,
                "totalQuantityKg": {"$round": ["$totalQuantityKg", 2]}
            }
        },
        {
            "$sort": {"category": 1, "status": 1}
        }
    ]

    return list(donations_col.aggregate(pipeline))

def get_ngo_fulfillment_stats():
    """
    Aggregation Pipeline 6:
    NGO request fulfillment statistics, including pending, approved, and fulfilled counts.
    Calculates fulfillment success rate percentage.
    """
    requests_col = get_requests_col()

    pipeline = [
        {
            "$group": {
                "_id": "$organizationId",
                "totalRequests": {"$sum": 1},
                "fulfilledCount": {
                    "$sum": {"$cond": [{"$eq": ["$status", "fulfilled"]}, 1, 0]}
                },
                "approvedCount": {
                    "$sum": {"$cond": [{"$eq": ["$status", "approved"]}, 1, 0]}
                },
                "pendingCount": {
                    "$sum": {"$cond": [{"$eq": ["$status", "pending"]}, 1, 0]}
                },
                "rejectedOrCancelledCount": {
                    "$sum": {"$cond": [{"$in": ["$status", ["rejected", "cancelled"]]}, 1, 0]}
                },
                "totalRequestedKg": {"$sum": "$requestedQuantityKg"}
            }
        },
        {
            "$lookup": {
                "from": "organizations",
                "localField": "_id",
                "foreignField": "_id",
                "as": "org"
            }
        },
        {
            "$unwind": "$org"
        },
        {
            "$project": {
                "_id": 0,
                "organizationId": {"$toString": "$_id"},
                "organizationName": "$org.organizationName",
                "serviceArea": "$org.serviceArea",
                "totalRequests": 1,
                "fulfilledCount": 1,
                "approvedCount": 1,
                "pendingCount": 1,
                "rejectedOrCancelledCount": 1,
                "totalRequestedKg": {"$round": ["$totalRequestedKg", 2]},
                "fulfillmentRate": {
                    "$cond": [
                        {"$gt": ["$totalRequests", 0]},
                        {
                            "$round": [
                                {
                                    "$multiply": [
                                        {"$divide": ["$fulfilledCount", "$totalRequests"]},
                                        100
                                    ]
                                },
                                1
                            ]
                        },
                        0
                    ]
                }
            }
        },
        {
            "$sort": {"totalRequests": -1}
        }
    ]

    return list(requests_col.aggregate(pipeline))

def get_platform_summary_kpis():
    """
    Overall platform impact KPI cards for dashboard headers.
    """
    deliveries_col = get_deliveries_col()
    donations_col = get_donations_col()
    users_col = get_users_col()
    orgs_col = get_organizations_col()

    # 1. Total rescued food (strictly verified delivered)
    rescued_agg = list(deliveries_col.aggregate([
        {
            "$match": {
                "status": "delivered",
                "pointsAwarded": True
            }
        },
        {
            "$group": {
                "_id": None,
                "totalRescuedKg": {"$sum": "$foodQuantityKg"},
                "completedDeliveries": {"$sum": 1}
            }
        }
    ]))

    total_rescued_kg = round(rescued_agg[0]["totalRescuedKg"], 2) if rescued_agg else 0.0
    completed_deliveries = rescued_agg[0]["completedDeliveries"] if rescued_agg else 0

    # 2. Total active available donations
    active_available_count = donations_col.count_documents({"status": "available"})
    total_donations_count = donations_col.count_documents({})

    # 3. User counts by role
    users_by_role = list(users_col.aggregate([
        {"$group": {"_id": "$role", "count": {"$sum": 1}}}
    ]))
    role_counts = {item["_id"]: item["count"] for item in users_by_role}

    # 4. Verified NGOs count
    verified_ngos = orgs_col.count_documents({"verificationStatus": "verified"})
    pending_ngos = orgs_col.count_documents({"verificationStatus": "pending"})

    # Meals estimate: 1 kg rescued food ≈ 2.5 meals provided
    estimated_meals = int(round(total_rescued_kg * 2.5))

    return {
        "totalRescuedKg": total_rescued_kg,
        "estimatedMeals": estimated_meals,
        "completedDeliveries": completed_deliveries,
        "activeDonations": active_available_count,
        "totalDonations": total_donations_count,
        "donorsCount": role_counts.get("donor", 0),
        "volunteersCount": role_counts.get("volunteer", 0),
        "ngosCount": role_counts.get("ngo", 0),
        "verifiedNgosCount": verified_ngos,
        "pendingNgosCount": pending_ngos
    }
