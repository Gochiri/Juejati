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
        <td title="${e.message}">${truncate(e.message, 80)}</td>
      </tr>`
    ).join('');
  } catch {
    document.getElementById('errors-body').innerHTML = '<tr><td colspan="3">Error cargando datos</td></tr>';
  }
}

// Messages
async function loadMessages() {
  try {
    const data = await fetchJSON('/messages?limit=30');
    const tbody = document.getElementById('messages-body');
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">Sin mensajes</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(m =>
      `<tr>
        <td>${formatDate(m.created_at)}</td>
        <td title="${m.contact_id}">${m.contact_id.slice(0, 8)}...</td>
        <td class="${m.direction === 'inbound' ? 'dir-in' : 'dir-out'}">${m.direction === 'inbound' ? 'IN' : 'OUT'}</td>
        <td>${m.channel || '-'}</td>
        <td title="${m.body || ''}">${truncate(m.body, 60)}</td>
      </tr>`
    ).join('');
  } catch {
    document.getElementById('messages-body').innerHTML = '<tr><td colspan="5">Error cargando datos</td></tr>';
  }
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

function loadAll() {
  loadHealth();
  loadStats();
  loadErrors();
  loadMessages();
}

loadAll();
loadPrompt();

// Auto-refresh every 30 seconds
setInterval(loadAll, 30000);
