from flask import jsonify

from .. import db
from ..models.contact_tags import ContactTag
from ..models.contacts import Contact
from ..models.tags import Tag


def create_contact(user_id, name, email, phone, address):
    try:
        new_contact = Contact(
            user_id=user_id,
            name=name,
            email=email,
            phone=phone,
            address=address
        )
        db.session.add(new_contact)
        db.session.commit()

        return {
            "status": "success",
            "contact": {
                "contact_id": new_contact.id,
                "name": new_contact.name,
                "email": new_contact.email,
                "phone": new_contact.phone,
                "address": new_contact.address
            }
        }, 201

    except Exception as e:
        db.session.rollback()
        return {
            "status": "error",
            "message": str(e)
        }, 500

def get_contacts(user_id, tags):
    try:
        contact_list = get_contact_list(user_id)

        if tags:
            contact_list = filter_contact_list(contact_list, tags)

        return jsonify({
            "status": "success",
            "contacts": contact_list
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

def get_contact_list(user_id):
    contacts = Contact.query.filter_by(user_id=user_id).all()

    contact_list = []
    for contact in contacts:
        contact_tags = ContactTag.query.filter_by(contact_id=contact.id).all()
        tag_ids = [ct.tag_id for ct in contact_tags]

        tag_data = []
        if tag_ids:
            tags = Tag.query.filter(Tag.id.in_(tag_ids)).all()
            tag_data = [{"tag_id": tag.id, "tag_name": tag.tag_name} for tag in tags]

        contact_data = {
            "contact_id": contact.id,
            "name": contact.name,
            "email": contact.email,
            "phone": contact.phone,
            "address": contact.address,
            "tags": tag_data
        }
        contact_list.append(contact_data)

    return contact_list

def filter_contact_list(contact_list, tags):
    tag_set = set(tags)

    return list(filter(
        lambda contact: tag_set.issubset({tag['id'] for tag in contact.get("tags", [])}),
        contact_list
    ))

def assign_tag_to_contact(user_id, contact_id, tag_id):
    contact = Contact.query.get(contact_id)
    if not contact or contact.user_id != user_id:
        return jsonify({
            "error": f"User does not have contact with ID {contact_id}."
        }), 403

    tag = Tag.query.get(tag_id)
    if not tag or tag.user_id != user_id:
        return jsonify({
            "error": f"User does not own tag with ID {tag_id}."
        }), 403

    existing = ContactTag.query.filter_by(contact_id=contact.id, tag_id=tag.id).first()
    if existing:
        return jsonify({
            "error": f"Tag ID {tag_id} is already assigned to contact ID {contact_id}."
        }), 409

    contact_tag = ContactTag(contact_id=contact.id, tag_id=tag.id)
    db.session.add(contact_tag)
    db.session.commit()

    return jsonify({"message": "Tag is successfully assigned."}), 200

def unassign_tag_from_contact(user_id, contact_id, tag_id):
    contact = Contact.query.get(contact_id)
    if not contact or contact.user_id != user_id:
        return jsonify({
            "error": f"User does not have contact with ID {contact_id}."
        }), 403

    contact_tag = ContactTag.query.filter_by(contact_id=contact_id, tag_id=tag_id).first()
    if not contact_tag:
        return jsonify({
            "error": f"The tag with ID {tag_id} is not assigned to the content with ID {contact_id}."
        }), 403

    db.session.delete(contact_tag)
    db.session.commit()

    return jsonify({"message": "Tag is successfully unassigned."}), 200


def delete_contact(user_id, contact_id):
    try:
        contact = Contact.query.get(contact_id)
        if not contact or contact.user_id != user_id:
            return jsonify({
                "error": f"User does not have contact with ID {contact_id}."
            }), 403
        db.session.delete(contact)

        contact_tags = ContactTag.query.filter_by(contact_id=contact_id).all()
        for contact_tag in contact_tags:
            db.session.delete(contact_tag)

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": f"Contact with id {contact_id} and its contact_tags deleted successfully."
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

def update_contact(user_id, contact_id, name, email, phone, address):
    contact = Contact.query.get(contact_id)
    if not contact or contact.user_id != user_id:
        return jsonify({
            "error": f"User does not have contact with ID {contact_id}."
        }), 403

    try:
        contact.name = name
        contact.email = email
        contact.phone = phone
        contact.address = address

        db.session.commit()
        return jsonify({
            "message": "Contact updated successfully.",
            "contact": {
                "contact_id": contact.id,
                "name": contact.name,
                "email": contact.email,
                "phone": contact.phone,
                "address": contact.address
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": "An error occurred while updating the contact.",
            "details": str(e)
        }), 500