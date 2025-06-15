Here are the exact places in your code where each of the “utilized” topics appears:

1. Regular Expressions
Where: In script.js, inside the validation routines.


const nameRegex  = /^[A-Za-zÇÖÜĞİŞçöüğiş\s]+$/u;
const phoneRegex = /^\+(?:90|1|44|49|33|34)\s\d{3}\s\d{3}\s\d{2}\s\d{2}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.(com|net|org|edu|gov|io|co)$/i;
Usage example:


const email = promptValidated(
  "Email (örnek: biri@birisi.com):",
  v => emailRegex.test(v),
  "Geçersiz email."
);
Here you call emailRegex.test(v) to enforce the correct pattern.

2. Collections
Where: Throughout both front end and back end.

Front end:

The global contacts array:


let contacts = [];
You use array methods like .map(), .filter(), and .sort() on that array. For example:


contacts = data.contacts.map(c => ({ … }));
contacts.filter(c => c.name.toLowerCase().includes(query));
contacts.sort((a, b) => a.name.localeCompare(b.name));
Back end (Python):

In get_contact_list(), you build a contact_list = [] and then use a for contact in contacts: loop to append each contact_data dictionary.

Tag lists are managed as Python lists (e.g. tag_ids = [ct.tag_id for ct in contact_tags]).

3. Comparators
Where: Any time you call .sort(...) in JavaScript, you provide a comparator function.

Name‐sorting example (A–Z, Z–A):


contacts.sort((a, b) =>
  a.name.localeCompare(b.name, "tr", { sensitivity: "base" })
);
Phone‐sorting example (0–9, 9–0):


contacts.sort((a, b) => {
  const da = a._phoneDigits;
  const db = b._phoneDigits;
  return da.localeCompare(db, undefined, { numeric: true });
});
4. Streams
Where: You use JavaScript’s array‐based “stream” methods (.map(), .filter(), .sort()) as your primary data‐pipeline operations.

.map() to transform the raw JSON into your in‐memory objects:


contacts = data.contacts.map(c => ({
  contact_id: c.contact_id,
  name:       c.name,
  phone:      c.phone,
  email:      c.email,
  address:    c.address,
  tags:       (c.tags || []).map(t => t.tag_name)
}));
.filter() to perform client‐side searching:


const filtered = contacts.filter(c => {
  return (
    c.name.toLowerCase().includes(query) ||
    c.phone.replace(/\D/g, "").includes(queryDigits) ||
    c.email.toLowerCase().includes(query) ||
    c.address.toLowerCase().includes(query)
  );
});
.sort() (covered above) is also part of the same “stream” paradigm.

5. Networking
Where: Every fetch(...) call in script.js is an example of client‐to‐server networking.

Load contacts:


const response = await fetch(`http://127.0.0.1:5000/contacts/${userId}`);
Create a contact:


const contactResp = await fetch(`http://127.0.0.1:5000/contacts/create/${userId}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name, email, phone, address })
});
Assign a tag:


const assignResp = await fetch(`http://127.0.0.1:5000/contacts/assign_tag/${userId}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ contact_id: newContact.contact_id, tag_id: match.tag_id })
});
Delete a contact:


const res = await fetch(`http://127.0.0.1:5000/contacts/${userId}`, {
  method: "DELETE",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ contact_id: c.contact_id })
});
Search (optional advanced route):


const res = await fetch(`http://127.0.0.1:5000/contacts/search/${userId}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query, country_code, digits, sort_by, reverse, parallel })
});
Recap:
Regular Expressions → in script.js nameRegex, phoneRegex, emailRegex.

Collections → the JS contacts array, Python list<Contact> in get_contact_list().

Comparators → the comparator callbacks you pass into .sort() (e.g. a.name.localeCompare(b.name)).

Streams → using .map(), .filter(), and .sort() on JS arrays as your data pipeline.

Networking → all the fetch(...) calls to your Flask endpoints.

These are the precise spots in your code where each utilized topic shows up.







