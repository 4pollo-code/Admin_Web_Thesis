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
    CORS(app, supports_credentials=True, origins=[app.config.get("FRONTEND_URL")])
    
    db.init_app(app)
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")

    app.permanent_session_lifetime = timedelta(minutes=30)

    @app.before_request
    def make_session_not_permanent():
        session.permanent = False

    from app.routes.auth import auth_bp
    app.register_blueprint(auth_bp)
    
    from app.routes.userManagement import userManagement_bp
    app.register_blueprint(userManagement_bp)
    from app.routes.questionManagement import question_sets_bp
    app.register_blueprint(question_sets_bp)
    from app.routes.dataManagement import dataset_bp
    app.register_blueprint(dataset_bp)

    return app
