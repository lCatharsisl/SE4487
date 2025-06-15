// script.js (updated)
let userId = localStorage.getItem("userId");
if (!userId) {
  // If there is no userId in localStorage, redirect back to login:
  window.location.href = "../login.html";
} else {
  userId = parseInt(userId, 10);
}

let contacts = [];
const contactList = document.querySelector('.contact-list');
const addTagButton = document.getElementById('addTagButton');
const addContactButton = document.getElementById('addContactButton');
const customTagsDiv = document.getElementById('customTags');
const sortButtons = document.querySelectorAll('.sort-button'); 
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
let sortAscending = true;


const nameRegex = /^[A-Za-zÇÖÜĞİŞçöüğiş\s]+$/u;
const phoneRegex = /^\+(?:90|1|44|49|33|34)\s\d{3}\s\d{3}\s\d{2}\s\d{2}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.(com|net|org|edu|gov|io|co)$/i;

// unchanged helper for prompting + validation
function promptValidated(message, validator, errorMsg) {
  while (true) {
    const val = prompt(message);
    if (val === null) return null;
    if (validator(val.trim())) return val.trim();
    alert(errorMsg);
  }
}

// --- UPDATED: loadContacts now calls the Flask API instead of a local file ---
async function loadContacts() {
  try {
    // Fetch only this one user’s contacts:
    const res = await fetch(`http://127.0.0.1:5000/contacts/${userId}`);
    if (!res.ok) {
      throw new Error(`User ${userId} fetch failed: ${res.status}`);
    }
    const data = await res.json();
    if (data.status !== 'success') {
      throw new Error(`User ${userId} error: ${data.message}`);
    }

    // Map each contact so we keep tag‐objects as before:
    contacts = data.contacts.map(c => ({
      contact_id: c.contact_id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      tags: c.tags || []
    }));

    renderContacts();
  }
  catch (err) {
    console.error(err);
    alert('Kişiler yüklenirken hata oluştu: ' + err.message);
  }
}




// --- UPDATED: renderContacts now assumes tags is an array of strings (converted above) ---
function renderContacts() {
  contactList.innerHTML = '';

  contacts.forEach((c, idx) => {
    const li = document.createElement('li');
    li.className = 'contact-card';
    li.dataset.index = idx;

    // Build HTML for each contact, leaving a placeholder for tags:
    li.innerHTML = `
      <h2>${c.name}</h2>
      <button class="edit-button">Düzenle</button>
      <button class="delete-button">✕</button>
      <p>📞 ${c.phone}</p>
      <p>📧 ${c.email}</p>
      <p>🏠 ${c.address || ''}</p>
      <div class="contact-tags-container"></div>
    `;

    // Attach edit/delete listeners:
    li.querySelector('.edit-button').addEventListener('click', () => editContact(idx));
    li.querySelector('.delete-button').addEventListener('click', () => deleteContact(idx));

    // Now render the tags inside the .contact-tags-container
    const tagsContainer = li.querySelector('.contact-tags-container');

    c.tags.forEach(tagObj => {
      // tagObj has shape { tag_id, tag_name }
      const tagDiv = document.createElement('div');
      tagDiv.className = 'contact-tag';
      tagDiv.dataset.tagId = tagObj.tag_id;

      // Span with the tag’s name:
      const spanText = document.createElement('span');
      spanText.className = 'tag-text';
      spanText.textContent = tagObj.tag_name;

      // Delete (unassign) button:
      const btnUnassign = document.createElement('button');
      btnUnassign.className = 'tag-unassign';
      btnUnassign.textContent = '✕';

      // Append span + button to tagDiv, then to container
      tagDiv.appendChild(spanText);
      tagDiv.appendChild(btnUnassign);
      tagsContainer.appendChild(tagDiv);

      // When “✕” is clicked, unassign this tag from the contact
      btnUnassign.addEventListener('click', async () => {
        if (!confirm(`"${tagObj.tag_name}" etiketini bu kişiden çıkarmak istediğinizden emin misiniz?`))
          return;

        try {
          const response = await fetch(
            `http://127.0.0.1:5000/contacts/unassign_tag/${userId}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contact_id: c.contact_id,
                tag_id: tagObj.tag_id
              })
            }
          );
          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Etiket silme hatası: ${response.status} → ${errText}`);
          }
          const dataUn = await response.json();
          if (dataUn.error) {
            throw new Error(dataUn.error);
          }
          // If successful, remove this tag from c.tags and re-render
          c.tags = c.tags.filter(t => t.tag_id !== tagObj.tag_id);
          renderContacts();
        }
        catch (err) {
          console.error(err);
          alert('Etiket çıkarılırken hata: ' + err.message);
        }
      });
    });

    // Finally, append the fully‐built <li> to the list
    contactList.appendChild(li);
  });
}


// --- The rest of your edit/delete/add UI logic can remain unchanged, 
//     since you’re still mutating the in-memory `contacts` array locally --- 

async function editContact(idx) {
  const c = contacts[idx];

  // 1) Prompt for basic fields:
  const name = promptValidated(
    `İsim (mevcut: ${c.name}) (sadece harf ve boşluk):`,
    v => nameRegex.test(v),
    'Geçersiz isim.'
  );
  if (name === null) return;

  const phone = promptValidated(
    `Telefon (mevcut: ${c.phone}) (+90 123 456 78 90):`,
    v => phoneRegex.test(v),
    'Geçersiz telefon.'
  );
  if (phone === null) return;

  const email = promptValidated(
    `Email (mevcut: ${c.email}) (örnek: biri@birisi.com):`,
    v => emailRegex.test(v),
    'Geçersiz email.'
  );
  if (email === null) return;

  const address = promptValidated(
    `Adres (mevcut: ${c.address || 'boş'}):`,
    v => true,
    ''
  );
  if (address === null) return;

  // ───────────────────────────────────────────────────────────
  // 2) Fetch all tags from DB so we can validate names:
  let allTags = [];
  try {
    const resTags = await fetch(`http://127.0.0.1:5000/tags/${userId}`);
    if (!resTags.ok) throw new Error(`Etiketler alınamadı: ${resTags.status}`);
    const dataTags = await resTags.json();
    if (dataTags.status !== 'success') throw new Error(dataTags.message);
    allTags = dataTags.tags; // [{id, user_id, tag_name}, …]
  } catch (err) {
    console.error(err);
    alert('Etiketler alınırken hata oluştu: ' + err.message);
    return;
  }

  const tagNameToId = {};
  allTags.forEach(t => {
    tagNameToId[t.tag_name.toLowerCase()] = t.id;
  });

  // 3) Prompt in a loop until valid or blank:
  let newTagNames = [];
  while (true) {
    const tagsStr = promptValidated(
      `Etiketler (virgülle ayır; mevcut: ${c.tags.join(', ')}). Boşsa hiç etiket yok:`,
      v => true,
      ''
    );
    if (tagsStr === null) return; // user cancelled edit

    newTagNames = tagsStr
      .split(',')
      .map(t => t.trim())
      .filter(t => t);

    if (newTagNames.length === 0) {
      // user wants no tags → accept and break
      break;
    }

    const invalids = newTagNames.filter(name =>
      !(name.toLowerCase() in tagNameToId)
    );
    if (invalids.length > 0) {
      alert(`Aşağıdaki etiket(ler) veri tabanında yok: ${invalids.join(', ')}\nLütfen tekrar deneyin.`);
      // loop again
    } else {
      // all good
      break;
    }
  }

  // Convert to tag IDs:
  const tagIdsToAssign = newTagNames.map(name =>
    tagNameToId[name.toLowerCase()]
  );

  // 4) Update only contact fields:
  const payload = {
    contact_id: c.contact_id,
    name: name,
    phone: phone,
    email: email,
    address: address
  };

  try {
    const resUpdate = await fetch(`http://127.0.0.1:5000/contacts/update/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!resUpdate.ok) {
      const errText = await resUpdate.text();
      throw new Error(`Güncelleme hatası: ${resUpdate.status} → ${errText}`);
    }
    const dataUpdate = await resUpdate.json();
    if (dataUpdate.error) throw new Error(dataUpdate.error);

    // 5) Assign each new tag ID:
    const assignPromises = tagIdsToAssign.map(tagId =>
      fetch(`http://127.0.0.1:5000/contacts/assign_tag/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: c.contact_id,
          tag_id: tagId
        })
      })
        .then(resAssign => {
          if (!resAssign.ok) {
            return resAssign.text().then(txt => {
              throw new Error(`Etiket ${tagId} atama hatası: ${resAssign.status} → ${txt}`);
            });
          }
          return resAssign.json();
        })
        .then(dataAssign => {
          if (dataAssign.error) {
            throw new Error(dataAssign.error);
          }
          return tagId;
        })
    );

    await Promise.all(assignPromises);
    // 6) Re-load everything
    await loadContacts();
    renderContacts();
    alert('Kişi ve etiketler başarıyla güncellendi.');
  }
  catch (err) {
    console.error(err);
    alert('Güncelleme sırasında hata: ' + err.message);
  }
}

async function deleteContact(idx) {
  // 1) Find the contact object by index:
  const c = contacts[idx];
  const shouldDelete = confirm(`${c.name} adlı kişiyi silmek istediğinizden emin misiniz?`);
  if (!shouldDelete) return;

  try {
    const payload = { contact_id: c.contact_id };

    const res = await fetch(`http://127.0.0.1:5000/contacts/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Silme isteği başarısız: ${res.status} → ${errText}`);
    }

    const data = await res.json();
    // Backend’in delete_contact() fonksiyonu, başarılıysa muhtemelen:
    // { status: "success", message: "Contact deleted successfully." }
    if (data.status === 'error' || data.error) {
      // Eğer hata formatınız { error: "…"} ise bunu da yakalayabilirsiniz:
      throw new Error(data.message || data.error || 'Silme sırasında hata oluştu.');
    }

    // 2) Sunucu tarafı başarıyla silindi → front-end dizisinden de kaldır:
    contacts.splice(idx, 1);

    // 3) Listeyi yeniden çiz:
    renderContacts();
    alert("Kişi başarıyla silindi.");
  }
  catch (err) {
    console.error(err);
    alert("Silme başarısız: " + err.message);
  }
}

function addCustomTag() {
  const tag = promptValidated('Yeni etiket adı:', v => v.length > 0, 'Etiket boş olamaz.');
  if (tag === null) return;
  if (![...customTagsDiv.children].some(el => el.textContent === tag)) {
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = tag;
    customTagsDiv.appendChild(span);
  }
}

// script.js

async function addContact() {
  // 1) Prompt for contact fields
  const name = promptValidated(
    'Yeni kişi ismi (sadece harf ve boşluk):',
    v => nameRegex.test(v),
    'Geçersiz isim.'
  );
  if (name === null) return;

  const phone = promptValidated(
    'Telefon (+90 123 456 78 90):',
    v => phoneRegex.test(v),
    'Geçersiz telefon.'
  );
  if (phone === null) return;

  const email = promptValidated(
    'Email (örnek: biri@birisi.com):',
    v => emailRegex.test(v),
    'Geçersiz email.'
  );
  if (email === null) return;

  const address = promptValidated('Adres:', v => true, '');
  if (address === null) return;

  // 2) Prompt for tag IDs (comma-separated). Example: "3,5,7"
  const tagsStr = promptValidated(
    'Etiket ID’leri (virgülle ayır, örnek: "3,5,7"):',
    v => true,
    ''
  );
  if (tagsStr === null) return;

  // Convert that string into an array of integers, filtering out invalids
  const tagIds = tagsStr
    .split(',')
    .map(s => s.trim())
    .filter(s => s !== '')
    .map(s => parseInt(s, 10))
    .filter(n => !isNaN(n));

  // 3) Build the payload for creating the contact (no tags yet)
  const payload = {
    name: name,
    phone: phone,
    email: email,
    address: address
  };

  try {

    // 4) First: send the contact data to the backend to create it
    const resCreate = await fetch(`http://127.0.0.1:5000/contacts/create/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!resCreate.ok) {
      const errText = await resCreate.text();
      throw new Error(`Kişi oluşturulamadı: ${resCreate.status} → ${errText}`);
    }

    const dataCreate = await resCreate.json();
    if (dataCreate.status !== 'success') {
      throw new Error(dataCreate.message || 'Kişi oluşturulamadı.');
    }

    // 5) Extract the newly assigned contact_id
    const newContact = dataCreate.contact;
    //   { contact_id, name, email, phone, address }
    const contactId = newContact.contact_id;

    // 6) If any tag IDs were entered, assign them one by one
    //    Build an array of Promises—one per tag assignment
    const assignPromises = tagIds.map(tagId =>
      fetch(`http://127.0.0.1:5000/contacts/assign_tag/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: contactId,
          tag_id: tagId
        })
      })
        .then(resAssign => {
          if (!resAssign.ok) {
            return resAssign.text().then(txt => {
              throw new Error(`Etiket ${tagId} atama hatası: ${resAssign.status} → ${txt}`);
            });
          }
          return resAssign.json();
        })
        .then(dataAssign => {
          if (dataAssign.error) {
            throw new Error(dataAssign.error);
          }
          // dataAssign.message örneğin "Tag is successfully assigned."
          return tagId; // return the tagId on success
        })
    );

    // 7) Wait until all assignments finish (or fail)
    //    If any throws, Promise.all will reject immediately
    const assignedTagIds = await Promise.all(assignPromises);

    // 8) Push the new contact into the in-memory array, including its tags
    //    (Depending on how you render tags, you might want to store IDs or names here.)
    contacts.push({
      contact_id: newContact.contact_id,
      name: newContact.name,
      phone: newContact.phone,
      email: newContact.email,
      address: newContact.address,
      tags: assignedTagIds    // if your `renderContacts()` shows tags by ID
    });

    // 9) Finally, re-render so the new contact + tags appear
    renderContacts();
    alert('Kişi ve etiketler başarıyla eklendi.');
  }
  catch (err) {
    console.error(err);
    alert('Kişi eklenirken hata oluştu: ' + err.message);
  }
}

// Don't forget to wire it up:
//addContactButton.addEventListener('click', addContact);
function renderGivenContacts(list) {
  contactList.innerHTML = '';
  list.forEach((c, idx) => {
    const li = document.createElement('li');
    li.className = 'contact-card';
    li.dataset.index = idx;
    li.innerHTML = `
      <h2>${c.name}</h2>
      <button class="edit-button">Düzenle</button>
      <button class="delete-button">✕</button>
      <p>📞 ${c.phone}</p>
      <p>📧 ${c.email}</p>
      <p>🏠 ${c.address || ''}</p>
      ${c.tags.map(t => `<span class="tag">${t}</span>`).join('')}
    `;
    li.querySelector('.edit-button').addEventListener('click', () => editContact(idx));
    li.querySelector('.delete-button').addEventListener('click', () => deleteContact(idx));
    contactList.appendChild(li);
  });
}

function performSearch() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) {
    // If the query is empty, show all contacts
    renderContacts();
    return;
  }

  // Filter the global `contacts` array:
  const filtered = contacts.filter(c => {
    return (
      c.name.toLowerCase().includes(query) ||
      c.phone.replace(/\s+/g, '').includes(query.replace(/\s+/g, '')) ||
      c.email.toLowerCase().includes(query) ||
      c.address.toLowerCase().includes(query)
    );
  });

  renderGivenContacts(filtered);
}

sortButtons.forEach(btn => {
  btn.addEventListener('click', async () => {
    // 1) Reload the latest contacts from the server
    await loadContacts();

    // 2) Normalize phone digits for each contact once
    //    (we’ll strip all non-digits so "+90 535 070 24 94" → "905350702494")
    contacts.forEach(c => {
      c._phoneDigits = (c.phone || '').replace(/\D/g, '');
    });

    // 3) Decide sort behavior based on the button’s label:
    const label = btn.textContent.trim().toUpperCase();

    switch (label) {
      case 'A-Z':
        // Sort by name ascending (Turkish locale, base sensitivity)
        contacts.sort((a, b) =>
          a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' })
        );
        break;

      case 'Z-A':
        // Same as A-Z, then reverse
        contacts.sort((a, b) =>
          a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' })
        );
        contacts.reverse();
        break;

      case '0-9':
        // Sort by numeric phone ascending
        contacts.sort((a, b) => {
          // Compare as strings of equal length—localeCompare works if they share the same digit count.
          // If you prefer numeric compare: parseInt(c._phoneDigits) but for very long numbers it can overflow.
          return a._phoneDigits.localeCompare(b._phoneDigits, undefined, { numeric: true });
        });
        break;

      case '9-0':
        // Sort by numeric phone descending
        contacts.sort((a, b) => {
          return a._phoneDigits.localeCompare(b._phoneDigits, undefined, { numeric: true });
        });
        contacts.reverse();
        break;

      default:
        // If there’s any other “sort-button,” do nothing
        return;
    }

    // 4) Re-render the (now-sorted) list
    renderContacts();
  });
});

async function addTagToDatabase() {
  const tagName = promptValidated(
    'Yeni etiket adı:',
    v => v.trim().length > 0,
    'Etiket boş olamaz.'
  );
  if (tagName === null) return;

  try {
    const response = await fetch(
      `http://127.0.0.1:5000/tags/create/${userId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag_name: tagName })
      }
    );
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Etiket oluşturulamadı: ${response.status} → ${errText}`);
    }
    const data = await response.json();
    if (data.error) throw new Error(data.error);

    // Wrap the new tag exactly as loadTags() does:
    const newTag = data.tag; // { id, user_id, tag_name }
    const container = document.createElement('div');
    container.className = 'tag-item';
    container.dataset.tagId = newTag.id;

    const spanText = document.createElement('span');
    spanText.className = 'tag-text';
    spanText.textContent = newTag.tag_name;

    const btnDelete = document.createElement('button');
    btnDelete.className = 'tag-delete';
    btnDelete.textContent = '✕';

    container.appendChild(spanText);
    container.appendChild(btnDelete);
    customTagsDiv.appendChild(container);

    // 1) Toggle selected on click:
    spanText.addEventListener('click', () => {
      container.classList.toggle('selected');
      filterContactsBySelectedTags();
    });
    
    // 2) Delete on ❌ click:
    btnDelete.addEventListener('click', async () => {
      if (!confirm(`"${newTag.tag_name}" etiketini silmek istediğinizden emin misiniz?`))
        return;
      try {
        const delRes = await fetch(`http://127.0.0.1:5000/tags/${userId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tag_id: newTag.id })
        });
        if (!delRes.ok) {
          const errText = await delRes.text();
          throw new Error(`Etiket silme hatası: ${delRes.status} → ${errText}`);
        }
        const delData = await delRes.json();
        if (delData.status === 'error' || delData.error) {
          throw new Error(delData.message || delData.error);
        }
        container.remove();
      }
      catch (err) {
        console.error(err);
        alert('Etiket silinirken hata: ' + err.message);
      }
    });

    alert('Etiket başarıyla eklendi.');
  }
  catch (err) {
    console.error(err);
    alert('Etiket eklenirken hata oluştu: ' + err.message);
  }
}

async function loadTags() {
  try {
    const res = await fetch(`http://127.0.0.1:5000/tags/${userId}`);
    if (!res.ok) throw new Error(`Etiketler alınamadı: ${res.status}`);
    const data = await res.json();
    if (data.status !== 'success') throw new Error(data.message);

    // Clear existing
    customTagsDiv.innerHTML = '';

    data.tags.forEach(t => {
      // Container for each tag + delete button:
      const container = document.createElement('div');
      container.className = 'tag-item';
      container.dataset.tagId = t.id;

      // The clickable tag text itself:
      const spanText = document.createElement('span');
      spanText.className = 'tag-text';
      spanText.textContent = t.tag_name;

      // The delete button (❌):
      const btnDelete = document.createElement('button');
      btnDelete.className = 'tag-delete';
      btnDelete.textContent = '✕';

      // Append text and button to container, then to the parent div:
      container.appendChild(spanText);
      container.appendChild(btnDelete);
      customTagsDiv.appendChild(container);

      // 1) Click on tag text toggles “selected”:
      spanText.addEventListener('click', () => {
        container.classList.toggle('selected');
        filterContactsBySelectedTags();
      });
      

      // 2) Click on delete button removes tag from DB and DOM:
      btnDelete.addEventListener('click', async () => {
        if (!confirm(`"${t.tag_name}" etiketini silmek istediğinizden emin misiniz?`))
          return;
        try {
          const response = await fetch(
            `http://127.0.0.1:5000/tags/${userId}`,
            {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tag_id: t.id })
            }
          );
          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Etiket silme hatası: ${response.status} → ${errText}`);
          }
          const dataDel = await response.json();
          if (dataDel.status === 'error' || dataDel.error) {
            throw new Error(dataDel.message || dataDel.error);
          }
          // Remove from DOM:
          container.remove();
        }
        catch (err) {
          console.error(err);
          alert('Etiket silinirken hata: ' + err.message);
        }
      });
    });
  }
  catch (err) {
    console.error(err);
    alert('Etiketler yüklenirken hata oluştu: ' + err.message);
  }
}

async function unassignTagFromContact(contactId, tagId) {
  const res = await fetch(`http://127.0.0.1:5000/contacts/unassign_tag/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contact_id: contactId, tag_id: tagId })
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Etiket silme hatası: ${res.status} → ${txt}`);
  }
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error);
  }
  // success → return nothing
}

// -------------------
// Helper: render a given list of contacts (same structure as renderContacts)
// -------------------
function renderContactList(list) {
  contactList.innerHTML = '';

  list.forEach((c, idx) => {
    const li = document.createElement('li');
    li.className = 'contact-card';
    li.dataset.index = idx;

    li.innerHTML = `
      <h2>${c.name}</h2>
      <button class="edit-button">Düzenle</button>
      <button class="delete-button">✕</button>
      <p>📞 ${c.phone}</p>
      <p>📧 ${c.email}</p>
      <p>🏠 ${c.address || ''}</p>
      <div class="contact-tags-container"></div>
    `;

    li.querySelector('.edit-button').addEventListener('click', () => editContact(idx));
    li.querySelector('.delete-button').addEventListener('click', () => deleteContact(idx));

    const tagsContainer = li.querySelector('.contact-tags-container');
    c.tags.forEach(tagObj => {
      const tagDiv = document.createElement('div');
      tagDiv.className = 'contact-tag';
      tagDiv.dataset.tagId = tagObj.tag_id;

      const spanText = document.createElement('span');
      spanText.className = 'tag-text';
      spanText.textContent = tagObj.tag_name;

      const btnUnassign = document.createElement('button');
      btnUnassign.className = 'tag-unassign';
      btnUnassign.textContent = '✕';

      tagDiv.appendChild(spanText);
      tagDiv.appendChild(btnUnassign);
      tagsContainer.appendChild(tagDiv);

      btnUnassign.addEventListener('click', async () => {
        if (!confirm(`"${tagObj.tag_name}" etiketini bu kişiden çıkarmak istediğinizden emin misiniz?`))
          return;
        try {
          const response = await fetch(
            `http://127.0.0.1:5000/contacts/unassign_tag/${userId}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contact_id: c.contact_id,
                tag_id: tagObj.tag_id
              })
            }
          );
          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Etiket silme hatası: ${response.status} → ${errText}`);
          }
          const dataUn = await response.json();
          if (dataUn.error) {
            throw new Error(dataUn.error);
          }
          // Remove from c.tags then re-render the filtered list:
          c.tags = c.tags.filter(t => t.tag_id !== tagObj.tag_id);
          filterContactsBySelectedTags();
        }
        catch (err) {
          console.error(err);
          alert('Etiket çıkarılırken hata: ' + err.message);
        }
      });
    });

    contactList.appendChild(li);
  });
}

// -------------------
// Helper: gather selected tag-IDs and filter contacts accordingly
// -------------------
function filterContactsBySelectedTags() {
  // 1) Find all tag-items in the global list that have .selected
  const selectedTagEls = Array.from(customTagsDiv.querySelectorAll('.tag-item.selected'));
  const selectedIds = selectedTagEls.map(el => parseInt(el.dataset.tagId, 10));

  if (selectedIds.length === 0) {
    // No tags selected → show all
    renderContacts();
    return;
  }

  // 2) Filter `contacts` to those that have at least one matching tag_id
  const filtered = contacts.filter(c =>
    c.tags.some(t => selectedIds.includes(t.tag_id))
  );

  // 3) Render only that subset
  renderContactList(filtered);
}



// 3) Kaldırın eski addCustomTag dinleyicisini (varsa) ve yerine yenisini ekleyin:
addTagButton.removeEventListener('click', addCustomTag); // Eğer önceden bağlandıysa
addTagButton.addEventListener('click', addTagToDatabase);

searchButton.addEventListener('click', performSearch);
searchInput.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') performSearch();
});

addContactButton.addEventListener('click', addContact);
window.addEventListener('DOMContentLoaded', async () => {
  await loadContacts();
  await loadTags();      // Populate existing tags on page load
});