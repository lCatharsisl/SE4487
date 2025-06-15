from flask import jsonify

from .. import db
from ..models.contact_tags import ContactTag
from ..models.tags import Tag
from ..models.users import User


def create_tag(user_id, tag_name):
    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({'error': f'There is no user with id {user_id}'}), 409

    existing_tag = Tag.query.filter_by(user_id=user_id, tag_name=tag_name).first()
    if existing_tag:
        return {'error': f"Tag '{tag_name}' already exists for user {user_id}"}, 409

    try:
        new_tag = Tag(user_id=user_id, tag_name=tag_name)
        db.session.add(new_tag)
        db.session.commit()

        return {
            'message': 'Tag created successfully',
            'tag': {
                'id': new_tag.id,
                'user_id': new_tag.user_id,
                'tag_name': new_tag.tag_name
            }
        }, 201

    except Exception as e:
            return jsonify({
                "status": "error",
                "message": str(e)
            }), 500

def get_tags(user_id):
    try:
        tags = Tag.query.filter_by(user_id=user_id).all()

        tag_list = list(map(lambda tag: {
            "id": tag.id,
            "user_id": tag.user_id,
            "tag_name": tag.tag_name
        }, tags))

        return jsonify({
            "status": "success",
            "tags": tag_list
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

def delete_tag(user_id, tag_id):
    try:
        tag = Tag.query.filter_by(id=tag_id, user_id=user_id).first()
        if not tag:
            return jsonify({
                "error": f"User does not have tag with ID {tag_id}."
            }), 403
        db.session.delete(tag)

        contact_tags = ContactTag.query.filter_by(tag_id=tag_id).all()
        for contact_tag in contact_tags:
            db.session.delete(contact_tag)

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": f"Tag with id {tag_id} and its contact_tags deleted successfully."
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500