import pytest
import os
import sys

# Ensure backend root is in python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from database.connection import get_db, get_client
from database.init_db import initialize_database
from database.seed_data import seed_database
from middleware.auth import generate_token

@pytest.fixture(scope="session")
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as test_client:
        yield test_client

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Initializes and seeds the database before running tests."""
    initialize_database()
    seed_database()
    yield

@pytest.fixture
def auth_tokens():
    db = get_db()
    admin_user = db.users.find_one({"role": "admin"})
    donor_user = db.users.find_one({"role": "donor"})
    ngo_user = db.users.find_one({"role": "ngo"})
    vol_user = db.users.find_one({"role": "volunteer"})

    return {
        "admin": generate_token(admin_user),
        "donor": generate_token(donor_user),
        "ngo": generate_token(ngo_user),
        "volunteer": generate_token(vol_user),
        "donor_user": donor_user,
        "ngo_user": ngo_user,
        "vol_user": vol_user,
        "admin_user": admin_user
    }
