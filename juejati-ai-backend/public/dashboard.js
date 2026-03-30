const API = '/admin/api';

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function truncate(str, len = 120) {
  if (!str) return '-';
  return str.length > len ? str.slice(0, len) + '...' : str;
}

async function fetchJSON(path) {
  const res = await fetch(API + path);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Health
async function loadHealth() {
  try {
    const data = await fetchJSON('/health');
    const el = document.getElementById('health-status');
    el.textContent = 'Online';
    el.className = 'status-badge online';
    document.getElementById('health-uptime').textContent = formatUptime(data.uptime_seconds);
    document.getElementById('health-memory').textContent = data.memory_mb;
    document.getElementById('health-db').textContent = data.db_connected ? 'Conectada' : 'Error';
  } catch {
    const el = document.getElementById('health-status');
    el.textContent = 'Offline';
    el.className = 'status-badge offline';
  }
}

// Stats
async function loadStats() {
  try {
    const data = await fetchJSON('/stats');
    document.getElementById('stat-props').textContent = data.properties_active;
    document.getElementById('stat-msgs').textContent = data.messages_total;
    document.getElementById('stat-errs').textContent = data.errors_last_24h;
  } catch {}
}

// Usage
async function loadUsage() {
  try {
    const data = await fetchJSON('/usage');
    document.getElementById('usage-cost-24h').textContent = `$${parseFloat(data.cost_24h).toFixed(4)}`;
    document.getElementById('usage-cost-30d').textContent = `$${parseFloat(data.cost_30d).toFixed(4)}`;
    document.getElementById('usage-cost-total').textContent = `$${parseFloat(data.total_cost_usd).toFixed(4)}`;
    document.getElementById('usage-tokens-24h').textContent = parseInt(data.tokens_24h).toLocaleString('es-AR');
  } catch {}
}

// Errors
async function loadErrors() {
  try {
    const data = await fetchJSON('/errors?limit=20');
    const tbody = document.getElementById('errors-body');
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3">Sin errores</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(e =>
      `<tr class="error-row">
        <td>${formatDate(e.created_at)}</td>
        <td>${e.source}</td>
        <td title="${(e.message || '').replace(/"/g, '&quot;')}">${truncate(e.message, 80)}</td>
      </tr>`
    ).join('');
  } catch {
    document.getElementById('errors-body').innerHTML = '<tr><td colspan="3">Error cargando datos</td></tr>';
  }
}

// Conversations
async function loadConversations() {
  try {
    const data = await fetchJSON('/conversations');
    const list = document.getElementById('contact-list');
    if (data.length === 0) {
      list.innerHTML = '<p>Sin conversaciones</p>';
      return;
    }
    list.innerHTML = data.map(c =>
      `<div class="contact-item" data-contact="${c.contact_id}" onclick="loadChat('${c.contact_id}', this)">
        <div class="contact-id">${c.contact_id.slice(0, 12)}...</div>
        <div class="contact-meta">${c.msg_count} msgs - ${formatDate(c.last_message)}</div>
      </div>`
    ).join('');
  } catch {
    document.getElementById('contact-list').innerHTML = '<p>Error cargando</p>';
  }
}

async function loadChat(contactId, el) {
  // Mark active
  document.querySelectorAll('.contact-item').forEach(i => i.classList.remove('active'));
  if (el) el.classList.add('active');

  const chatView = document.getElementById('chat-view');
  chatView.innerHTML = '<p>Cargando...</p>';

  try {
    const data = await fetchJSON(`/conversations/${contactId}`);
    if (data.length === 0) {
      chatView.innerHTML = '<p class="chat-placeholder">Sin mensajes</p>';
      return;
    }
    chatView.innerHTML = data.map(m =>
      `<div class="chat-bubble ${m.direction}">
        <div>${m.body || '<em>imagen</em>'}</div>
        <div class="chat-time">${formatDate(m.created_at)}</div>
      </div>`
    ).join('');
    chatView.scrollTop = chatView.scrollHeight;
  } catch {
    chatView.innerHTML = '<p>Error cargando conversacion</p>';
  }
}

// Model
async function loadModel() {
  try {
    const data = await fetchJSON('/model');
    document.getElementById('model-select').value = data.value;
  } catch {}
}

async function saveModel() {
  const value = document.getElementById('model-select').value;
  const status = document.getElementById('model-status');
  try {
    const res = await fetch(API + '/model', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    status.textContent = 'Modelo actualizado. Aplica al proximo mensaje.';
    status.style.color = '#22c55e';
  } catch (err) {
    status.textContent = 'Error: ' + err.message;
    status.style.color = '#ef4444';
  }
  setTimeout(() => { status.textContent = ''; }, 3000);
}

// Prompt
async function loadPrompt() {
  try {
    const data = await fetchJSON('/prompt');
    const editor = document.getElementById('prompt-editor');
    editor.value = data.value;
    updateCharCount();
  } catch {
    document.getElementById('prompt-editor').value = 'Error cargando prompt';
  }
}

function updateCharCount() {
  const len = document.getElementById('prompt-editor').value.length;
  document.getElementById('prompt-chars').textContent = `${len} caracteres`;
}

async function savePrompt() {
  const value = document.getElementById('prompt-editor').value;
  const status = document.getElementById('prompt-status');
  try {
    const res = await fetch(API + '/prompt', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    status.textContent = 'Guardado correctamente';
    status.style.color = '#22c55e';
  } catch (err) {
    status.textContent = 'Error al guardar: ' + err.message;
    status.style.color = '#ef4444';
  }
  setTimeout(() => { status.textContent = ''; }, 3000);
}

// Init
document.getElementById('prompt-save').addEventListener('click', savePrompt);
document.getElementById('prompt-editor').addEventListener('input', updateCharCount);
document.getElementById('model-save').addEventListener('click', saveModel);

function loadAll() {
  loadHealth();
  loadStats();
  loadUsage();
  loadErrors();
  loadConversations();
}

loadAll();
loadPrompt();
loadModel();

// Auto-refresh every 30 seconds
setInterval(loadAll, 30000);
