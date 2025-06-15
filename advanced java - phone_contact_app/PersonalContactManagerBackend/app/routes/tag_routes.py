from flask import Blueprint, request, jsonify
from ..services.tag_services import create_tag, get_tags, delete_tag

tag_bp = Blueprint('tag', __name__)

"""
Input JSON:
{
    "tag_name": "school"
}
"""
@tag_bp.route("/tags/create/<int:user_id>", methods=["POST"])
def create_tag_route(user_id):
    data = request.get_json()

    if not data or "tag_name" not in data:
        return jsonify({"error": "Missing 'tag_name' in request body"}), 400

    if not user_id:
        return jsonify({"error": "Missing 'user_id' in URL"}), 400

    tag_name = data.get("tag_name")
    result = create_tag(user_id, tag_name)
    return result

"""
Input JSON:
{

}
"""
@tag_bp.route("/tags/<int:user_id>", methods=["GET"])
def get_tags_route(user_id):
    if not user_id:
        return jsonify({"error": "Missing 'user_id' in URL"}), 400

    return get_tags(user_id)

"""
Input JSON:
{
    "tag_id": "1"
}
"""
@tag_bp.route("/tags/<int:user_id>", methods=["DELETE"])
def delete_tag_route(user_id):
    data = request.get_json()

    if not data or "tag_id" not in data:
        return jsonify({"error": "Missing 'tag_id' in request body"}), 400

    if not user_id:
        return jsonify({"error": "Missing 'user_id' in URL"}), 400

    tag_id = data.get("tag_id")
    return delete_tag(user_id, tag_id)
