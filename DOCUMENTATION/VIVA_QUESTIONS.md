# FoodRescue: Intelligent NoSQL Databases (CSE494)
## Viva Examination Comprehensive Guide & Q&A Pack

This guide prepares students for the oral viva examination and technical defense for the **CSE494 – Intelligent NoSQL Databases** course project.

---

### Category 1: MongoDB Core Architecture & Document Modeling

#### Q1: Why did you choose MongoDB over a traditional Relational Database (RDBMS) for the FoodRescue application?
**Answer:**
1. **Dynamic and Polymorphic Data**: Food rescue transactions involve diverse dietary profiles, varying vehicle attributes (car, bicycle, van), and custom packaging metadata that vary by donation category. Document databases represent nested arrays and polymorphic records natively without requiring complex many-to-many junction tables.
2. **High Write Throughput & Scalability**: Commercial dining and volunteer pickups involve rapid status transitions and telemetry updates. MongoDB provides high write throughput with document-level locking (`WiredTiger` storage engine).
3. **Powerful Native Aggregation**: MongoDB's multi-stage aggregation pipeline allows us to compute complex metrics (e.g. food rescued over time, top couriers, fulfillment percentages) inside the database engine without moving large datasets to application memory.

#### Q2: What is the difference between Embedding and Referencing in MongoDB? How did you apply this decision in FoodRescue?
**Answer:**
- **Embedding (Denormalization)** stores related data within a single document as subdocuments or arrays.
  - *When to use*: 1-to-few relationships where data is queried together and does not mutate independently.
  - *In FoodRescue*: `dietaryInfo` (e.g., `["Vegetarian", "Halal"]`) is embedded in `donations`, and `badges` are embedded in `volunteer_profiles`.
- **Referencing (Normalization)** stores documents in separate collections and links them using MongoDB `ObjectId` references.
  - *When to use*: 1-to-many or many-to-many relationships, when documents grow unbounded, or when entities have distinct mutation lifecycles.
  - *In FoodRescue*: `donations`, `donation_requests`, and `delivery_tasks` are modeled in separate collections and reference `users` and `organizations`. This avoids hitting the **16MB BSON document limit**, eliminates write locking contention between donors and volunteers, and allows multi-perspective queries.

#### Q3: What is BSON and how does it differ from standard JSON?
**Answer:**
BSON (Binary JSON) is the binary-encoded serialization format used by MongoDB to store documents and perform remote procedure calls.
- **Data Types**: JSON only supports strings, numbers, booleans, arrays, and null. BSON extends this with specialized types essential for database operations, including `ObjectId`, `Date` (64-bit UTC timestamp), `Decimal128` (high-precision arithmetic), `Int32`, `Int64`, and raw `Binary`.
- **Performance**: BSON includes field length prefixes, allowing the engine to traverse and search documents faster without parsing character streams.

---

### Category 2: Schema Validation & Integrity ($jsonSchema)

#### Q4: If MongoDB is "schemaless", how does FoodRescue enforce data integrity?
**Answer:**
While MongoDB is flexible, production enterprise systems require governed schemas. FoodRescue implements a **hybrid dual-layer validation architecture**:
1. **Database-Level `$jsonSchema` Validation**: Enforced directly inside MongoDB using the `$jsonSchema` validator configured with `validationLevel: "strict"` and `validationAction: "error"`. If any client or script attempts to insert an invalid document (e.g., negative food weight or invalid enum status), MongoDB rejects the write operation with a `WriteError: Document failed validation`.
2. **Application-Level Validation**: The Python Flask backend inspects and validates incoming JSON payloads before query execution, returning descriptive HTTP 400 error responses to the client.

#### Q5: Can you give an example of a `$jsonSchema` rule enforced in your database?
**Answer:**
In the `donations` collection validator:
- `quantityKg`: Must be a number with a minimum value of `0.1` (`"minimum": 0.1`). This prevents zero or negative donation quantities.
- `category`: Must belong to a strict enum of approved categories (`"enum": ["Cooked Meals", "Bakery & Bread", ...]`).
- `status`: Must belong to the state transition lifecycle enum (`"enum": ["available", "requested", "assigned", "picked_up", "delivered", "expired", "cancelled"]`).
- `donorId`: Must be of type `objectId`.

---

### Category 3: Indexing Strategies & Query Optimization

#### Q6: Which indexes did you create and why?
**Answer:**
1. **Unique Index on `users.email` (`{"email": 1}`, `unique: true`)**: Guarantees at the database level that no duplicate user accounts can be registered.
2. **Compound Index on `donations.status` and `availableUntil` (`{"status": 1, "availableUntil": 1}`)**: Speeds up public browse queries where the frontend searches for `status == "available"` while checking that the collection deadline has not passed.
3. **Foreign Reference Indexes (`donorId`, `volunteerId`, `donationId`)**: Accelerates `$lookup` joins and user dashboard queries from `O(N)` collection scans to `O(log N)` index seeks.
4. **Descending Index on `volunteer_profiles.totalPoints` (`{"totalPoints": -1}`)**: Allows the volunteer leaderboard aggregation to read the top ranked volunteers directly from the index in sorted order without an in-memory sort stage.

#### Q7: What is the difference between a Collection Scan (COLLSCAN) and an Index Scan (IXSCAN)?
**Answer:**
- **COLLSCAN**: The query engine scans every document in the collection from disk. This is `O(N)` and causes severe performance degradation as the database grows.
- **IXSCAN**: The query engine traverses an efficient B-Tree index structure (`O(log N)`) to find only the matching record keys, then fetches only those specific documents. Indexes ensure fast sub-millisecond response times.

---

### Category 4: MongoDB Aggregation Pipelines

#### Q8: What is the Aggregation Framework and how does it compare to SQL `GROUP BY`?
**Answer:**
The MongoDB Aggregation Framework is a pipeline-based data processing model modeled on Unix pipes (`|`). Documents enter a multi-stage pipeline where each stage transforms the document stream (filtering with `$match`, grouping with `$group`, joining with `$lookup`, projecting with `$project`, and sorting with `$sort`).
Compared to SQL:
- SQL `SELECT ... FROM ... JOIN ... GROUP BY ... HAVING` evaluates in a fixed order.
- MongoDB Aggregation pipelines are explicit, composable sequences where stages can be repeated or ordered dynamically (e.g. `$match` -> `$group` -> `$lookup` -> `$match` -> `$sort`).

#### Q9: Explain Pipeline 1: "Food Rescued Trend Over Time" in your project.
**Answer:**
```python
[
    {"$match": {"status": "delivered", "pointsAwarded": True, "deliveredAt": {"$ne": None}}},
    {"$project": {
        "period": {"$dateToString": {"format": "%Y-%m-%d", "date": "$deliveredAt"}},
        "foodQuantityKg": "$foodQuantityKg"
    }},
    {"$group": {
        "_id": "$period",
        "totalRescuedKg": {"$sum": "$foodQuantityKg"},
        "deliveryCount": {"$sum": 1}
    }},
    {"$sort": {"_id": 1}}
]
```
- **Food Rescue Definition**: We strictly filter for completed deliveries where `pointsAwarded` is `True`. Cancelled, uncollected, or expired donations are eliminated at the initial `$match` stage.
- `$project` converts the timestamp to a day string (`YYYY-MM-DD`).
- `$group` accumulates the total kilograms and delivery count per date.
- `$sort` orders the timeline chronologically for visualization in Recharts.

#### Q10: How does the `$lookup` stage work in MongoDB?
**Answer:**
`$lookup` performs a left outer equijoin between two collections within the same database.
For example, in Pipeline 2 (Food Donated by Each Donor):
```python
{
    "$lookup": {
        "from": "users",
        "localField": "_id",        # donorId from grouping
        "foreignField": "_id",      # _id in users collection
        "as": "donor"
    }
}
```
This joins the user document into an array field named `donor`. We then use `$unwind: "$donor"` to deconstruct the single-element array into a flat object for field projection.

---

### Category 5: Concurrency Control & ACID Guarantees

#### Q11: How did you prevent multiple NGOs from claiming the same available donation?
**Answer:**
By using MongoDB's atomic `find_one_and_update` operation:
```python
claimed = db.donations.find_one_and_update(
    {"_id": donation_id, "status": "available"},
    {"$set": {"status": "requested"}}
)
```
In MongoDB, single-document writes are always atomic. If two NGOs submit requests concurrently, MongoDB locks the document at the WiredTiger row level. The first request finds `status: "available"` and updates it. The second request immediately fails because `status` is now `"requested"`, and returns an HTTP 409 Conflict.

#### Q12: How do you guarantee that volunteer reward points are not awarded twice?
**Answer:**
We implement an **idempotent atomic state transition** in `services/reward_service.py`. When an NGO confirms receipt:
```python
updated_task = db.delivery_tasks.find_one_and_update(
    {
        "_id": task_id,
        "status": {"$in": ["accepted", "picked_up"]},
        "pointsAwarded": False
    },
    {
        "$set": {"status": "delivered", "pointsAwarded": True}
    }
)
```
Only if `pointsAwarded` is currently `False` does the update succeed. If the NGO double-clicks or re-submits the request, the query condition fails, `updated_task` returns `None`, and zero points are awarded.

---

### Category 6: PyMongo Driver & Python Integration

#### Q13: What is PyMongo and how does it handle connection pooling?
**Answer:**
`PyMongo` is the official Python client library for MongoDB. When instantiating `MongoClient(MONGO_URI)`, PyMongo automatically maintains an internal thread-safe **connection pool** (default max pool size of 100 sockets). This avoids the overhead of opening and closing TCP connections on every incoming Flask HTTP request.

#### Q14: How did you handle serialization of MongoDB ObjectIds and Datetimes for Flask JSON responses?
**Answer:**
Standard Python `json.dumps()` cannot serialize MongoDB `bson.ObjectId` or `datetime.datetime` objects. In `database/connection.py`, we implemented a recursive `serialize_doc()` utility function that converts all `ObjectId` instances to 24-character hexadecimal strings and all datetimes to ISO-8601 UTC strings.

---

### Category 7: Scalability & Production Readiness

#### Q15: How would you scale FoodRescue if donation volume grew to millions of records per day?
**Answer:**
1. **Sharding (Horizontal Partitioning)**: Deploy a sharded cluster. We can shard the `donations` and `delivery_tasks` collections using a compound shard key such as `{serviceArea: 1, createdAt: 1}` to distribute writes across distinct geographic shards.
2. **Replica Sets (High Availability)**: Run a 3-node primary-secondary replica set (`P-S-S`) providing automatic failover if the primary node experiences hardware failure.
3. **Read Preference**: Direct read-heavy analytics queries to secondary nodes using `read_preference=ReadPreference.SECONDARY_PREFERRED` to reduce CPU load on the primary write node.
