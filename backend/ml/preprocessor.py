import os
import sys
import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.model_selection import train_test_split

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.connection import get_db

CATEGORICAL_COLS = ["foodCategory", "donorType", "transportMode"]
NUMERICAL_COLS = ["quantityKg", "shelfLifeHours", "prepHour", "distanceKm", "storageTempCelsius", "isWeekend"]

class MLDataPreprocessor:
    def __init__(self):
        self.encoder = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
        self.scaler = StandardScaler()
        self.feature_names = []
        self.is_fitted = False

    def load_data_from_mongodb(self):
        """
        Extracts records directly from MongoDB collection 'ml_rescue_records' using PyMongo.
        """
        db = get_db()
        col = db["ml_rescue_records"]
        cursor = col.find({}, {"_id": 0})
        records = list(cursor)

        if not records:
            # Fallback auto-seed if empty
            from ml.dataset_generator import seed_ml_dataset_to_mongodb
            seed_ml_dataset_to_mongodb()
            records = list(col.find({}, {"_id": 0}))

        df = pd.DataFrame(records)
        return df

    def fit_transform(self, df):
        """
        Fits encoder & scaler on the DataFrame and returns transformed X and targets.
        """
        X_num = df[NUMERICAL_COLS].values
        X_cat = df[CATEGORICAL_COLS].values

        X_cat_encoded = self.encoder.fit_transform(X_cat)
        cat_feature_names = list(self.encoder.get_feature_names_out(CATEGORICAL_COLS))

        X_num_scaled = self.scaler.fit_transform(X_num)
        num_feature_names = NUMERICAL_COLS

        X_processed = np.hstack([X_num_scaled, X_cat_encoded])
        self.feature_names = num_feature_names + cat_feature_names
        self.is_fitted = True

        # Targets
        y_clf = df["claimSuccess"].values.astype(int)
        y_reg = df["deliveryTimeMinutes"].values.astype(float)
        y_qty = df["quantityKg"].values.astype(float)

        return X_processed, y_clf, y_reg, y_qty

    def transform(self, df):
        """
        Transforms new incoming data using already fitted scaler and encoder.
        """
        if not self.is_fitted:
            raise ValueError("Preprocessor has not been fitted yet!")

        # Ensure all columns exist
        df_copy = df.copy()
        for col in NUMERICAL_COLS:
            if col not in df_copy:
                df_copy[col] = 0.0
        for col in CATEGORICAL_COLS:
            if col not in df_copy:
                df_copy[col] = "Unknown"

        X_num = df_copy[NUMERICAL_COLS].values
        X_cat = df_copy[CATEGORICAL_COLS].values

        X_num_scaled = self.scaler.transform(X_num)
        X_cat_encoded = self.encoder.transform(X_cat)

        return np.hstack([X_num_scaled, X_cat_encoded])

    def transform_single_payload(self, payload):
        """
        Transforms a single JSON dictionary into feature array for inference.
        """
        df_single = pd.DataFrame([{
            "quantityKg": float(payload.get("quantityKg", payload.get("quantity_kg", 20.0))),
            "shelfLifeHours": float(payload.get("shelfLifeHours", payload.get("shelf_life_hours", 12.0))),
            "prepHour": int(payload.get("prepHour", payload.get("prep_hour", 14))),
            "distanceKm": float(payload.get("distanceKm", payload.get("distance_km", 5.0))),
            "storageTempCelsius": float(payload.get("storageTempCelsius", payload.get("storage_temp", 20.0))),
            "isWeekend": int(payload.get("isWeekend", payload.get("is_weekend", 0))),
            "foodCategory": str(payload.get("foodCategory", payload.get("category", "Cooked Meals"))),
            "donorType": str(payload.get("donorType", payload.get("donor_type", "Restaurant"))),
            "transportMode": str(payload.get("transportMode", payload.get("transport_mode", "motorcycle")))
        }])
        return self.transform(df_single)

    def save(self, filepath):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump({
            "encoder": self.encoder,
            "scaler": self.scaler,
            "feature_names": self.feature_names,
            "is_fitted": self.is_fitted
        }, filepath)

    @classmethod
    def load(cls, filepath):
        data = joblib.load(filepath)
        obj = cls()
        obj.encoder = data["encoder"]
        obj.scaler = data["scaler"]
        obj.feature_names = data["feature_names"]
        obj.is_fitted = data["is_fitted"]
        return obj
