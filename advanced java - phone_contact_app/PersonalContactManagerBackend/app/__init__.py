from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')

    CORS(app)
    db.init_app(app)

    from .routes.auth_routes import auth_bp
    from .routes.tag_routes import tag_bp
    from .routes.contact_routes import contact_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(tag_bp)
    app.register_blueprint(contact_bp)

    return app
