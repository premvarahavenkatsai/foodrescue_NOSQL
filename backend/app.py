import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from config import Config

from routes.auth_routes import auth_bp
from routes.donation_routes import donation_bp
from routes.request_routes import request_bp
from routes.delivery_routes import delivery_bp
from routes.analytics_routes import analytics_bp
from routes.admin_routes import admin_bp
from routes.user_routes import user_bp
from routes.ml_routes import ml_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for all API endpoints with configurable origins
    CORS(app, resources={r"/api/*": {"origins": Config.CORS_ORIGINS}})

    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(donation_bp, url_prefix="/api/donations")
    app.register_blueprint(request_bp, url_prefix="/api/requests")
    app.register_blueprint(delivery_bp, url_prefix="/api/deliveries")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(user_bp, url_prefix="/api/users")
    app.register_blueprint(ml_bp, url_prefix="/api/ml")

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "FoodRescue API",
            "database": "MongoDB (foodrescue_db)",
            "version": "1.0.0"
        }), 200

    # Serve compiled React frontend assets if enabled or dist exists
    has_dist = os.path.isdir(Config.STATIC_FOLDER) and os.path.isfile(os.path.join(Config.STATIC_FOLDER, "index.html"))
    if Config.SERVE_STATIC or has_dist:
        @app.route("/", defaults={"path": ""})
        @app.route("/<path:path>")
        def serve_frontend(path):
            if path and os.path.exists(os.path.join(Config.STATIC_FOLDER, path)):
                return send_from_directory(Config.STATIC_FOLDER, path)
            return send_from_directory(Config.STATIC_FOLDER, "index.html")

    @app.errorhandler(404)
    def not_found(e):
        # Fallback to SPA index.html for non-API routes if static folder exists
        if (Config.SERVE_STATIC or has_dist):
            from flask import request
            if not request.path.startswith("/api/"):
                return send_from_directory(Config.STATIC_FOLDER, "index.html")
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "Internal server error"}), 500

    return app

app = create_app()

if __name__ == "__main__":
    print(f"[SERVER] FoodRescue Backend running on http://localhost:{Config.PORT}")
    app.run(host="0.0.0.0", port=Config.PORT, debug=Config.DEBUG)
