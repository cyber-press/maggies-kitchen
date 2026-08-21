const PASSWORD = '032180';
const STORAGE = 'maggiesKitchenContent';
const SESSION = 'maggiesKitchenAdmin';
const DB_NAME = 'maggiesKitchenMedia';
const DB_STORE = 'images';

let defaults = {};
let content = {};
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const get = (object, path) => path.split('.').reduce((value, key) => value?.[key], object);
const set = (object, path, value) => {
  const keys = path.split('.');
  let cursor = object;
  keys.slice(0, -1).forEach((key) => {
    cursor = cursor[key] ??= {};
  });
  cursor[keys.at(-1)] = value;
};

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(DB_STORE)) {
        request.result.createObjectStore(DB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function dbPut(key, blob) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DB_STORE, 'readwrite');
    transaction.objectStore(DB_STORE).put(blob, key);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
}

async function dbGet(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(DB_STORE).objectStore(DB_STORE).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function dbClear() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DB_STORE, 'readwrite');
    transaction.objectStore(DB_STORE).clear();
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
}

async function load() {
  try {
    defaults = await fetch('assets/data/site-content.json', { cache: 'no-store' }).then((response) => {
      if (!response.ok) throw new Error('Unable to load site content');
      return response.json();
    });
    try {
      content = JSON.parse(localStorage.getItem(STORAGE)) || structuredClone(defaults);
    } catch {
      content = structuredClone(defaults);
    }
    await render();
  } catch (error) {
    showToast('Dashboard content could not be loaded. Refresh the page.');
    console.error(error);
  }
}

function login() {
  sessionStorage.setItem(SESSION, '1');
  $('#login-screen').classList.add('hidden');
  $('#admin-app').classList.remove('hidden');
  load();
}

const loginForm = $('#login-form');
loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const enteredPassword = String($('#admin-password').value || '').trim();
  if (enteredPassword === PASSWORD) {
    $('#login-error').textContent = '';
    login();
  } else {
    $('#login-error').textContent = 'Incorrect password. Enter 032180 exactly.';
    $('#admin-password').focus();
    $('#admin-password').select();
  }
});

$('#toggle-password').addEventListener('click', () => {
  const input = $('#admin-password');
  input.type = input.type === 'password' ? 'text' : 'password';
  $('#toggle-password').textContent = input.type === 'password' ? 'Show' : 'Hide';
});

$('#logout-button').addEventListener('click', () => {
  sessionStorage.removeItem(SESSION);
  location.reload();
});

if (sessionStorage.getItem(SESSION) === '1') login();

function showPanel(name) {
  $$('.panel').forEach((item) => item.classList.toggle('active', item.id === `panel-${name}`));
  $$('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.panel === name));
  $('.sidebar').classList.remove('open');
  window.scrollTo(0, 0);
}

$('#admin-nav').addEventListener('click', (event) => {
  const button = event.target.closest('[data-panel]');
  if (button) showPanel(button.dataset.panel);
});
$$('[data-go]').forEach((button) => button.addEventListener('click', () => showPanel(button.dataset.go)));
$('#menu-toggle').addEventListener('click', () => $('.sidebar').classList.toggle('open'));

async function render() {
  $$('[data-key]').forEach((input) => {
    input.value = get(content, input.dataset.key) ?? '';
  });
  renderServices();
  renderTestimonials();
  await renderGallery();
  bindEditors();
  updateEditedCount();
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function renderServices() {
  $('#services-editor').innerHTML = content.services.map((service, index) => `
    <div class="form-card repeat-card">
      <div class="repeat-title"><span>${index + 1}</span><h3>Service ${index + 1}</h3></div>
      <label>Title<input data-array="services" data-index="${index}" data-field="title" value="${escapeHtml(service.title)}"></label>
      <label>Description<textarea rows="3" data-array="services" data-index="${index}" data-field="description">${escapeHtml(service.description)}</textarea></label>
    </div>`).join('');
}

function renderTestimonials() {
  $('#testimonials-editor').innerHTML = content.testimonials.map((testimonial, index) => `
    <div class="form-card repeat-card">
      <div class="repeat-title"><span>${index + 1}</span><h3>Testimonial ${index + 1}</h3></div>
      <label>Customer name<input data-array="testimonials" data-index="${index}" data-field="name" value="${escapeHtml(testimonial.name)}"></label>
      <label>Quote<textarea rows="3" data-array="testimonials" data-index="${index}" data-field="quote">${escapeHtml(testimonial.quote)}</textarea></label>
      <label>Star rating<input type="number" min="1" max="5" data-array="testimonials" data-index="${index}" data-field="rating" value="${testimonial.rating}"></label>
    </div>`).join('');
}

async function renderGallery() {
  const cards = await Promise.all(content.gallery.map(async (image, index) => {
    let source = image.src;
    const localImage = await dbGet(`gallery-${index}`);
    if (localImage) source = URL.createObjectURL(localImage);
    return `
      <article class="gallery-edit-card">
        <div class="photo-control">
          <img src="${escapeHtml(source)}" alt="${escapeHtml(image.alt)}">
          <label class="replace-photo">Replace Photo<input class="photo-input" type="file" accept="image/jpeg,image/png,image/webp" data-index="${index}"></label>
          <small>JPG, PNG or WebP, up to 8 MB</small>
        </div>
        <div>
          <strong>Image ${index + 1}</strong>
          <label>Published image path or URL<input data-array="gallery" data-index="${index}" data-field="src" value="${escapeHtml(image.src)}"></label>
          <label>Caption<input data-array="gallery" data-index="${index}" data-field="caption" value="${escapeHtml(image.caption)}"></label>
          <label>Accessibility text<textarea rows="2" data-array="gallery" data-index="${index}" data-field="alt">${escapeHtml(image.alt)}</textarea></label>
          <p class="photo-state">${localImage ? 'New photo active in this browser. Download the publishing package to publish it.' : 'Current published photo'}</p>
        </div>
      </article>`;
  }));
  $('#gallery-editor').innerHTML = cards.join('');
  $$('.photo-input').forEach((input) => input.addEventListener('change', replacePhoto));
}

async function replacePhoto(event) {
  const file = event.target.files[0];
  const index = Number(event.target.dataset.index);
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    showToast('Choose a JPG, PNG, or WebP image.');
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    showToast('Choose an image smaller than 8 MB.');
    return;
  }
  await dbPut(`gallery-${index}`, file);
  content.gallery[index].uploadName = safeName(file.name, index);
  save(true);
  await renderGallery();
  bindEditors();
  showToast('Photo replaced and applied to the site preview.');
}

function safeName(name, index) {
  const extension = (name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  return `gallery-${index + 1}.${extension}`;
}

let saveTimer;
function bindEditors() {
  $$('[data-key]').forEach((input) => {
    input.oninput = () => {
      set(content, input.dataset.key, input.value);
      save();
    };
  });
  $$('[data-array]').forEach((input) => {
    input.oninput = () => {
      const value = input.type === 'number' ? Number(input.value) : input.value;
      content[input.dataset.array][Number(input.dataset.index)][input.dataset.field] = value;
      save();
    };
  });
}

function save(immediately = false) {
  clearTimeout(saveTimer);
  $('#save-status').textContent = 'Saving...';
  const commit = () => {
    localStorage.setItem(STORAGE, JSON.stringify(content));
    $('#save-status').textContent = 'Changes saved locally';
    updateEditedCount();
  };
  if (immediately) commit();
  else saveTimer = setTimeout(commit, 250);
}

function updateEditedCount() {
  const walk = (current, original) => Object.keys(current).reduce((count, key) => {
    const value = current[key];
    return count + (value && typeof value === 'object' ? walk(value, original?.[key] || {}) : value !== original?.[key] ? 1 : 0);
  }, 0);
  $('#edited-count').textContent = walk(content, defaults);
}

function download(blob, name) {
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
}

$('#export-button').addEventListener('click', () => {
  download(new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' }), 'site-content.json');
  showToast('Content file downloaded.');
});

async function exportPackage() {
  const files = [];
  const published = structuredClone(content);
  for (let index = 0; index < published.gallery.length; index += 1) {
    const blob = await dbGet(`gallery-${index}`);
    if (blob) {
      const name = published.gallery[index].uploadName || safeName('photo.jpg', index);
      published.gallery[index].src = `assets/images/${name}`;
      delete published.gallery[index].uploadName;
      files.push({ name, blob });
    }
  }
  download(new Blob([JSON.stringify(published, null, 2)], { type: 'application/json' }), 'site-content.json');
  files.forEach((file) => download(file.blob, file.name));
  showToast(files.length ? `Downloaded content and ${files.length} replacement photo(s).` : 'Downloaded content file.');
}

if (!$('#package-button')) {
  const packageButton = document.createElement('button');
  packageButton.className = 'primary';
  packageButton.id = 'package-button';
  packageButton.textContent = 'Download Publishing Package';
  packageButton.addEventListener('click', exportPackage);
  $('#export-button')?.parentElement?.append(packageButton);
}

$('#import-file').addEventListener('change', async (event) => {
  try {
    content = JSON.parse(await event.target.files[0].text());
    localStorage.setItem(STORAGE, JSON.stringify(content));
    await render();
    showToast('Content imported successfully.');
  } catch {
    showToast('That file is not valid JSON.');
  }
});

$('#reset-button').addEventListener('click', async () => {
  if (confirm('Discard all local edits and replacement photos?')) {
    localStorage.removeItem(STORAGE);
    await dbClear();
    content = structuredClone(defaults);
    await render();
    showToast('Local changes reset.');
  }
});

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}
