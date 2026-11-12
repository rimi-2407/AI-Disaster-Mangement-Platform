
from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from extensions import db, jwt


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)

    db.init_app(app)
    jwt.init_app(app)

    @app.route("/", methods=["GET"])
    def home():
        return jsonify({
            "message": "AI Disaster Management Platform API is running",
            "status": "success"
        })

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "backend"
        }), 200

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True, port=5000)

