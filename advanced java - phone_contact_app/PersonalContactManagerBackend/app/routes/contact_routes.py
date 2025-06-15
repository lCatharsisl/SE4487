from flask import Blueprint, request, jsonify

from ..services.contact_services import (
    create_contact,
    get_contacts,
    assign_tag_to_contact,
    delete_contact,
    unassign_tag_from_contact,
    update_contact,
)

contact_bp = Blueprint('contact', __name__)


"""
Input JSON:
{
    "name": "Ahmet",
    "email": "ahmet@example.com",
    "phone": "05551234567",
    "address": "İstanbul, Türkiye"
}
"""
@contact_bp.route("/contacts/create/<int:user_id>", methods=["POST"])
def create_contact_route(user_id):
    data = request.get_json()

    if not data or "name" not in data:
        return jsonify({"error": "Missing 'name' in request body"}), 400

    if not user_id:
        return jsonify({"error": "Missing 'user_id' in URL"}), 400

    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone")
    address = data.get("address")

    return create_contact(user_id, name, email, phone, address)

"""
Input JSON:
{
    "contact_id": "1"
    "name": "Ahmet",
    "email": "ahmet@example.com",
    "phone": "05551234567",
    "address": "İstanbul, Türkiye"
}
"""
@contact_bp.route("/contacts/update/<int:user_id>", methods=["POST"])
def update_contact_route(user_id):
    data = request.get_json(silent=True) or {}

    if not data or "contact_id" not in data:
        return jsonify({"error": "Missing 'contact_id' in request body"}), 400

    if "name" not in data:
        return jsonify({"error": "Missing 'name' in request body"}), 400

    if not user_id:
        return jsonify({"error": "Missing 'user_id' in URL"}), 400

    contact_id = data.get("contact_id")
    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone")
    address = data.get("address")

    return update_contact(user_id, contact_id, name, email, phone, address)

"""
Input JSON:
{
    "contact_id": "1",
    "tag_id": "1"
}
"""
@contact_bp.route("/contacts/assign_tag/<int:user_id>", methods=["POST"])
def assign_tags_to_contact_route(user_id):
    data = request.get_json()

    if not data or "contact_id" not in data:
        return jsonify({"error": "Missing 'contact_id' in request body"}), 400

    if "tag_id" not in data:
        return jsonify({"error": "Missing 'tag_id' in request body"}), 400

    if not user_id:
        return jsonify({"error": "Missing 'user_id' in URL"}), 400

    contact_id = data.get("contact_id")
    tag_id = data.get("tag_id")

    return assign_tag_to_contact(user_id, contact_id, tag_id)

"""
Input JSON:
{
    "contact_id": "1",
    "tag_id": "1"
}
"""
@contact_bp.route("/contacts/unassign_tag/<int:user_id>", methods=["POST"])
def unassign_tag_from_contact_route(user_id):
    data = request.get_json()

    if not data or "contact_id" not in data:
        return jsonify({"error": "Missing 'contact_id' in request body"}), 400

    if "tag_id" not in data:
        return jsonify({"error": "Missing 'tag_id' in request body"}), 400

    if not user_id:
        return jsonify({"error": "Missing 'user_id' in URL"}), 400

    contact_id = data.get("contact_id")
    tag_id = data.get("tag_id")

    return unassign_tag_from_contact(user_id, contact_id, tag_id)


"""
Input JSON:
{

}
    OR
{
    "tag_ids": "[1,2]"
}
"""
@contact_bp.route("/contacts/<int:user_id>", methods=["GET"])
def get_contacts_route(user_id):
    #data = request.get_json()
    data = request.get_json(silent=True) or {}

    if not user_id:
        return jsonify({"error": "Missing 'user_id' in URL"}), 400

    tag_ids = None
    if "tag_ids" in data:
        tag_ids = data.get("tag_ids", [])

    return get_contacts(user_id, tag_ids)

"""
Input JSON:
{
    "contact_id": "1"
}
"""
@contact_bp.route("/contacts/<int:user_id>", methods=["DELETE"])
def delete_contact_route(user_id):
    data = request.get_json()

    if not data or "contact_id" not in data:
        return jsonify({"error": "Missing 'contact_id' in request body"}), 400

    contact_id = data.get("contact_id")

    if not user_id:
        return jsonify({"error": "Missing 'user_id' in URL"}), 400

    return delete_contact(user_id, contact_id)