from flask import jsonify
from ..models.users import User
from .. import db

def register_user(username, password):
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 409

    user = User(username=username)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    return jsonify({'message': 'Registration successful'}), 201

def login_user(username, password):
    user = User.query.filter_by(username=username).first()
    user_id = user.id

    if user and user.check_password(password):
        return jsonify({
            'message': 'Login successful',
            'user_id': user_id
        }), 200
    else:
        return jsonify({'error': 'Invalid username or password'}), 401
