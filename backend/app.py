
from models.alert import Alert
from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from extensions import db, jwt

# Models
from models.emergency import EmergencyReport
from models.user import User
from models.responder import Responder
from models.resources import Resource
from models.assignment import Assignment

# Routes
from routes.emergency_routes import emergency_bp
from routes.auth_routes import auth_bp
from routes.responder_routes import responder_bp
from routes.resource_routes import resource_bp
from routes.assignment_routes import assignment_bp
from routes.alerts_routes import alert_bp


def create_app():
    app = Flask(__name__)

    app.config.from_object(Config)

    CORS(app)

    db.init_app(app)
    jwt.init_app(app)

    # Register API routes
    app.register_blueprint(emergency_bp)
    app.register_blueprint(alert_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(responder_bp)
    app.register_blueprint(resource_bp)
    app.register_blueprint(assignment_bp)

    # Create database tables
    with app.app_context():
        db.create_all()

    @app.route("/")
    def home():
        return jsonify({
            "message": "AI Disaster Management Platform API is running"
        })

    @app.route("/api/health")
    def health():
        return jsonify({
            "status": "healthy",
            "message": "Backend is working"
        })

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True, port=5000)
