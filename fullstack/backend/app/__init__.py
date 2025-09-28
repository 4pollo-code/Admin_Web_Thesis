from flask import Flask, session
from datetime import timedelta
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from .config import Config
import os

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")

    # Session configuration for cross-origin cookies
    app.permanent_session_lifetime = timedelta(minutes=30)
    app.config['SESSION_COOKIE_SAMESITE'] = 'None'  # required for cross-origin
    app.config['SESSION_COOKIE_SECURE'] = True      # required for HTTPS

    @app.before_request
    def make_session_not_permanent():
        session.permanent = False

    # Register your blueprints
    from app.routes.auth import auth_bp
    app.register_blueprint(auth_bp)

    from app.routes.userManagement import userManagement_bp
    app.register_blueprint(userManagement_bp)

    from app.routes.questionManagement import question_sets_bp
    app.register_blueprint(question_sets_bp)

    from app.routes.dataManagement import dataset_bp
    app.register_blueprint(dataset_bp)

    # CORS configuration
    frontend_url = os.getenv("FRONTEND_URL")  # read from .env in local or Render
    CORS(
        app,
        supports_credentials=True,
        origins=[frontend_url],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"]
    )

    # Initialize the database
    db.init_app(app)

    return app
