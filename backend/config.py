import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    PORT = int(os.getenv("PORT", 5055))
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/foodrescue_db")
    DB_NAME = os.getenv("DB_NAME", "foodrescue_db")
    JWT_SECRET = os.getenv("JWT_SECRET", "supersecret_foodrescue_dev_key_2026_nosql")
    JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", 24))
    ENV = os.getenv("FLASK_ENV", "development")
    DEBUG = ENV == "development"

    # Production CORS settings: comma-separated list or wildcard
    raw_cors = os.getenv("CORS_ORIGINS", "*")
    CORS_ORIGINS = [o.strip() for o in raw_cors.split(",") if o.strip()] if raw_cors != "*" else "*"

    # Static build folder serving (for unified single-port mode)
    SERVE_STATIC = os.getenv("SERVE_STATIC", "false").lower() in ("true", "1", "yes")
    STATIC_FOLDER = os.getenv(
        "STATIC_FOLDER",
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
    )
