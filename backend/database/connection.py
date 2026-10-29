from pymongo import MongoClient
from datetime import datetime, date
from bson import ObjectId
from config import Config

_client = None

def get_client():
    global _client
    if _client is None:
        _client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=5000)
    return _client

def get_db(db_name=None):
    client = get_client()
    return client[db_name or Config.DB_NAME]

def get_users_col(db_name=None):
    return get_db(db_name)["users"]

def get_donations_col(db_name=None):
    return get_db(db_name)["donations"]

def get_organizations_col(db_name=None):
    return get_db(db_name)["organizations"]

def get_requests_col(db_name=None):
    return get_db(db_name)["donation_requests"]

def get_deliveries_col(db_name=None):
    return get_db(db_name)["delivery_tasks"]

def get_volunteers_col(db_name=None):
    return get_db(db_name)["volunteer_profiles"]

def serialize_doc(doc):
    """
    Recursively converts MongoDB ObjectIds and datetimes to JSON-serializable representations.
    """
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        result = {}
        for k, v in doc.items():
            if isinstance(v, ObjectId):
                result[k] = str(v)
            elif isinstance(v, (datetime, date)):
                result[k] = v.isoformat()
            elif isinstance(v, dict):
                result[k] = serialize_doc(v)
            elif isinstance(v, list):
                result[k] = serialize_doc(v)
            else:
                result[k] = v
        # Ensure 'id' alias is present for convenient frontend usage
        if "_id" in result and "id" not in result:
            result["id"] = result["_id"]
        return result
    if isinstance(doc, ObjectId):
        return str(doc)
    if isinstance(doc, (datetime, date)):
        return doc.isoformat()
    return doc
