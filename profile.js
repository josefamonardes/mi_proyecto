/* profile.js - vista Perfil (no carga script.js para no depender del DOM de tareas) */

const $ = (id) => document.getElementById(id);

function showAlert(message, type = 'info') {
  const alerts = $('alerts');
  if (!alerts) return;
  alerts.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
}

async function api(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'same-origin',
    ...options,
  });

  const data = await res.json().catch(() => null);
  return { res, data };
}

async function loadProfile() {
  const { data } = await api('api/auth/profile.php');

  if (!data || !data.ok) {
    // No autenticado: vuelve a login
    window.location.href = 'auth.html';
    return;
  }

  $('whoami').textContent = data.data.username;
  $('p-username').textContent = data.data.username;
  $('p-email').textContent = data.data.email;
  $('p-created').textContent = (data.data.created_at || '').replace('T', ' ');

  // UI auth
  $('btnLogin').classList.add('d-none');
  $('logoutBtn').classList.remove('d-none');
}

async function handleChangePassword(e) {
  e.preventDefault();

  const current_password = $('currentPassword').value;
  const new_password = $('newPassword').value;

  const fd = new FormData();
  fd.append('current_password', current_password);
  fd.append('new_password', new_password);

  const { data } = await api('api/auth/change_password.php', {
    method: 'POST',
    body: fd,
  });

  if (!data) {
    showAlert('Error: respuesta inválida del servidor', 'danger');
    return;
  }

  if (!data.ok) {
    showAlert(data.message || 'No se pudo cambiar la contraseña', 'warning');
    return;
  }

  $('currentPassword').value = '';
  $('newPassword').value = '';
  showAlert('Contraseña actualizada correctamente', 'success');
}

async function handleLogout() {
  await api('api/auth/logout.php', { method: 'POST' }).catch(() => {});
  window.location.href = 'auth.html';
}

document.addEventListener('DOMContentLoaded', () => {
  loadProfile();
  $('passwordForm').addEventListener('submit', handleChangePassword);
  $('logoutBtn').addEventListener('click', handleLogout);
});
