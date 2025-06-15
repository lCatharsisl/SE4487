from .. import db

class ContactTag(db.Model):
    __tablename__ = 'contact_tags'

    contact_id = db.Column(db.Integer, db.ForeignKey('contacts.id'), primary_key=True)
    tag_id = db.Column(db.Integer, db.ForeignKey('tags.id'), primary_key=True)

    contact = db.relationship('Contact', backref=db.backref('contact_tags', cascade="all, delete-orphan"))
    tag = db.relationship('Tag', backref=db.backref('contact_tags', cascade="all, delete-orphan"))
