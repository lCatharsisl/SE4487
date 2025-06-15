from flask import Blueprint, request, jsonify
from ..services.auth_service import register_user, login_user

auth_bp = Blueprint('auth', __name__)

"""
Input JSON:
{
    "username": "name of the user",
    "password": "the password"
}
"""
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Missing username or password'}), 400
    return register_user(data['username'], data['password'])


"""
Input JSON:
{
    "username": "name of the user",
    "password": "the password"
}
"""
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Missing username or password'}), 400
    return login_user(data['username'], data['password'])