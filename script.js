// script.js - Versión con comprobación whoami (opción A)
// - Si estamos en index.html, llama a /api/auth/whoami.php para validar sesión antes de cargar tareas.
// - Si whoami devuelve 401 -> redirige a auth.html.
// - Mantiene compatibilidad con auth.html (no intenta renderizar la lista cuando no existe).
// - Usa fetch credentials: 'include' para enviar cookies de sesión.

document.addEventListener('DOMContentLoaded', function() {
  // ====================
  // CONFIGURACIÓN
  // ====================
  const API_BASE_URL = '/mi_proyecto/api/tasks';
  const AUTH_BASE_URL = '/mi_proyecto/api/auth';
  const USE_API = true; // Cambiar a false para usar localStorage (sin autenticación remota)

  // ====================
  // SELECTORES DOM (puede que algunos no existan según la página)
  // ====================
  const authSection = document.getElementById('authSection');
  const appSection = document.getElementById('appSection');
  const whoami = document.getElementById('whoami');

  const registerForm = document.getElementById('registerForm');
  const loginForm = document.getElementById('loginForm');
  const logoutBtn = document.getElementById('logoutBtn');

  const taskForm = document.getElementById('taskForm');
  const taskInput = document.getElementById('taskInput');
  const prioritySelect = document.getElementById('prioritySelect');
  const dueDateInput = document.getElementById('taskDueDate');
  const tasksList = document.getElementById('tasksList');
  const filterGroup = document.getElementById('filterGroup');

  // ====================
  // VARIABLES GLOBALES
  // ====================
  let tasks = [];
  let currentFilter = 'all';
  let currentUser = null;

  // ====================
  // UTIL: alert simple
  // ====================
  function showAlert(message, type = 'info', timeout = 4000) {
    console.log(`[alert ${type}] ${message}`);
    // Esta función solo hace un log por ahora. Puedes reemplazar con un toast visual.
  }

  // ====================
  // HELPERS FETCH/JSON (incluye cookies)
  // ====================
  async function fetchJson(url, options = {}) {
    const opts = Object.assign({
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    }, options);

    if (opts.body && !(opts.body instanceof FormData) && typeof opts.body !== 'string') {
      opts.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
      opts.body = JSON.stringify(opts.body);
    }

    const res = await fetch(url, opts);
    const text = await res.text();

    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      const err = new Error('El servidor devolvió respuesta inválida. ¿Error PHP?');
      err.status = res.status;
      err.raw = text;
      throw err;
    }

    if (!res.ok) {
      const msg = data && data.error ? data.error : `HTTP ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      err.body = data;
      throw err;
    }

    return data;
  }

  // ====================
  // API request (tareas)
  // ====================
  async function apiRequest(endpoint, method = 'GET', data = null) {
    if (!USE_API) throw new Error('API deshabilitada - usando modo local');

    console.log(`📤 API Request: ${method} ${endpoint}`, data);
    let url = `${API_BASE_URL}/${endpoint}.php`;
    const options = { method, credentials: 'include' };

    if (method === 'GET' && data) {
      url += `?${new URLSearchParams(data).toString()}`;
    } else if (data) {
      options.body = data;
    }

    try {
      const result = await fetchJson(url, options);
      console.log(`📥 Response from ${endpoint}:`, result);
      return result;
    } catch (error) {
      console.error(`🔥 Error API (${endpoint}):`, error);
      let userMessage = error.message;
      if (error.message.includes('El servidor devolvió respuesta inválida')) {
        userMessage = 'Error en el servidor. Revisa la consola.';
      } else if (error.message.includes('Failed to fetch')) {
        userMessage = 'Error de conexión. ¿XAMPP está corriendo?';
      }
      showAlert(`⚠️ ${userMessage}`, 'warning');
      throw error;
    }
  }

  // ====================
  // AUTH API helpers
  // ====================
  async function authRequest(endpoint, method = 'POST', data = null) {
    if (!USE_API) throw new Error('Auth no disponible en modo local');
    const url = `${AUTH_BASE_URL}/${endpoint}.php`;
    const options = { method, credentials: 'include' };
    if (data) options.body = data;
    return fetchJson(url, options);
  }

  async function registerUser(username, email, password) {
    return authRequest('register', 'POST', { username, email, password });
  }

  async function loginUser(identifier, password) {
    return authRequest('login', 'POST', { identifier, password });
  }

  async function logoutUser() {
    return authRequest('logout', 'POST', {});
  }

  // ====================
  // whoami helper (opción A)
  // ====================
  async function whoamiRequest() {
    if (!USE_API) return null;
    try {
      const res = await fetch(`${AUTH_BASE_URL}/whoami.php`, { credentials: 'include' });
      console.log('📥 whoami status:', res.status);
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.log('📥 whoami response text:', text);
        const err = new Error('No autenticado');
        err.status = res.status;
        throw err;
      }
      const data = await res.json().catch(() => null);
      return data;
    } catch (err) {
      throw err;
    }
  }

  // ====================
  // LOCALSTORAGE helpers
  // ====================
  function localLoadTasks() {
    try { return JSON.parse(localStorage.getItem('taskflow_tasks') || '[]'); } catch { return []; }
  }
  function localSaveTasksArray(arr) {
    localStorage.setItem('taskflow_tasks', JSON.stringify(arr));
  }

  // ====================
  // AUTH UI helpers
  // ====================
  function showLoggedIn(username) {
    currentUser = { username };
    if (authSection) authSection.style.display = 'none';
    if (appSection) appSection.style.display = 'block';
    if (whoami) whoami.textContent = username || '';
  }

  function showLoggedOut() {
    currentUser = null;
    if (authSection) authSection.style.display = 'block';
    if (appSection) appSection.style.display = 'none';
    if (whoami) whoami.textContent = '';
  }

  // ====================
  // TAREAS: render / CRUD (seguro si no existe tasksList)
  // ====================
  function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text || ''; return div.innerHTML; }

  function renderTasks() {
    // Si no existe el contenedor de tareas, no hacemos nada (estamos en auth.html u otra página)
    if (!tasksList) return;

    tasksList.innerHTML = '';
    const filtered = tasks.filter(t => {
      if (currentFilter === 'all') return true;
      if (currentFilter === 'pending') return !t.completed;
      if (currentFilter === 'completed') return t.completed;
      if (currentFilter === 'urgent') return t.priority === 'urgente';
      return true;
    });

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'text-muted';
      empty.textContent = 'No hay tareas.';
      tasksList.appendChild(empty);
      return;
    }

    filtered.forEach(task => {
      const item = document.createElement('div');
      item.className = 'list-group-item d-flex justify-content-between align-items-start';
      const left = document.createElement('div');
      left.innerHTML = `<div class="fw-semibold">${escapeHtml(task.title || task.text || '')}</div>
                        <small class="text-muted">${task.due_date || task.dueDate || ''}</small>`;
      const right = document.createElement('div');
      const doneBtn = document.createElement('button');
      doneBtn.className = 'btn btn-sm btn-outline-success me-2';
      doneBtn.textContent = task.completed ? 'Reabrir' : 'Hecho';
      doneBtn.addEventListener('click', async () => {
        try {
          const updated = Object.assign({}, task, { completed: task.completed ? 0 : 1 });
          await updateTaskOnServer(updated);
          task.completed = updated.completed;
          renderTasks();
        } catch (err) {
          if (err && err.status === 401) redirectToAuth();
        }
      });

      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-sm btn-outline-danger';
      delBtn.textContent = 'Eliminar';
      delBtn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar tarea?')) return;
        try {
          await deleteTaskOnServer(task.id);
          tasks = tasks.filter(t => t.id !== task.id);
          renderTasks();
        } catch (err) {
          if (err && err.status === 401) redirectToAuth();
        }
      });

      right.appendChild(doneBtn);
      right.appendChild(delBtn);

      item.appendChild(left);
      item.appendChild(right);
      tasksList.appendChild(item);
    });
  }

  async function loadTasks() {
    if (!USE_API) {
      tasks = localLoadTasks();
      renderTasks();
      return tasks;
    }
    const res = await apiRequest('read', 'GET', null);
    // soportar múltiples formatos
    if (Array.isArray(res)) tasks = res;
    else if (res && res.tasks) tasks = res.tasks;
    else if (res && res.data) tasks = res.data;
    else tasks = [];
    renderTasks();
    return tasks;
  }

  async function saveTask(task) {
    if (!USE_API) {
      const arr = localLoadTasks();
      arr.push(task);
      localSaveTasksArray(arr);
      return task;
    }
    const res = await apiRequest('create', 'POST', task);
    if (res && res.task) return res.task;
    return res;
  }

  async function updateTaskOnServer(task) {
    if (!USE_API) {
      const arr = localLoadTasks().map(t => t.id === task.id ? task : t);
      localSaveTasksArray(arr);
      tasks = arr;
      return task;
    }
    const res = await apiRequest('update', 'POST', task);
    return res;
  }

  async function deleteTaskOnServer(id) {
    if (!USE_API) {
      const arr = localLoadTasks().filter(t => t.id !== id);
      localSaveTasksArray(arr);
      tasks = arr;
      return true;
    }
    const res = await apiRequest('delete', 'POST', { id });
    return res;
  }

  // ====================
  // HANDLERS: auth forms (si existen)
  // ====================
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = (registerForm.username && registerForm.username.value || '').trim();
      const email = (registerForm.email && registerForm.email.value || '').trim();
      const password = (registerForm.password && registerForm.password.value) || '';
      try {
        const res = await registerUser(username, email, password);
        if (res && res.success) {
          // redirigir a la app principal
          window.location.href = 'index.html';
        } else {
          showAlert(res.error || 'Error en registro', 'danger');
        }
      } catch (err) {
        showAlert(err.message || 'Error en registro', 'danger');
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const identifier = (loginForm.identifier && loginForm.identifier.value || '').trim();
      const password = (loginForm.password && loginForm.password.value) || '';
      try {
        const res = await loginUser(identifier, password);
        if (res && res.success) {
          // redirigir a la app principal
          window.location.href = 'index.html';
        } else {
          showAlert(res.error || 'Credenciales inválidas', 'danger');
        }
      } catch (err) {
        showAlert(err.message || 'Error en login', 'danger');
      }
    });
  }

  // Logout handler (si existe)
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await logoutUser();
      } catch (e) { /* ignore */ }
      // Forzar redirección a la página de autenticación (si existe)
      redirectToAuth();
    });
  }

  // Task form submit
  if (taskForm) {
    taskForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = (taskInput && taskInput.value || '').trim();
      const priority = (prioritySelect && prioritySelect.value) || 'media';
      const dueDate = (dueDateInput && dueDateInput.value) || null;

      if (!text) {
        showAlert('⚠️ Escribe una tarea primero', 'warning');
        if (taskInput) taskInput.focus();
        return;
      }

      const task = {
        id: Date.now(),
        text,
        title: text,
        description: '',
        priority,
        dueDate,
        due_date: dueDate,
        completed: 0,
        createdAt: new Date().toISOString()
      };

      try {
        const saved = await saveTask(task);
        tasks.push(saved);
        renderTasks();
        if (taskInput) taskInput.value = '';
        showAlert('✅ Tarea añadida correctamente', 'success');
      } catch (err) {
        if (err.status === 401) {
          showAlert('Necesitas iniciar sesión para crear tareas', 'warning');
          redirectToAuth();
          return;
        }
        showAlert(err.message || 'Error al guardar tarea', 'danger');
      }
    });
  }

  // Filtros
  if (filterGroup) {
    filterGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-filter]');
      if (!btn) return;
      const f = btn.getAttribute('data-filter');
      currentFilter = f;
      // marcar active
      Array.from(filterGroup.querySelectorAll('button')).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTasks();
    });
  }

  // ====================
  // REDIRECCIONES UTILS
  // ====================
  function redirectToAuth() {
    // intenta enviar a auth.html relativa al sitio
    window.location.href = 'auth.html';
  }

  // ====================
  // INICIALIZACIÓN (con whoami si estamos en index.html)
  // ====================
  console.log('🚀 TaskFlow iniciando...');
  (async () => {
    try {
      // Si estamos en la página de la app, validamos whoami antes de cargar tareas
      if (appSection) {
        if (USE_API) {
          try {
            const who = await whoamiRequest();
            if (who && who.success && who.user) {
              console.log('✅ whoami:', who.user);
              showLoggedIn(who.user.username || '');
            } else {
              console.warn('whoami no devolvió user -> redirigiendo a auth.html');
              redirectToAuth();
              return;
            }
          } catch (err) {
            // quien devuelve 401 u otro error -> redirigir a auth.html
            console.warn('whoami error:', err);
            redirectToAuth();
            return;
          }
        } else {
          // Modo local: mostramos la app (sin user real)
          showLoggedIn('');
        }

        // Ya validado, cargamos tareas
        await loadTasks();
        console.log('✅ TaskFlow cargado correctamente');
        console.log('📝 Escribe una tarea y presiona "Añadir" para probar');
      } else {
        // No estamos en la app (probablemente en auth.html): no intentar cargar tareas
        showLoggedOut();
        console.log('⚙️ Página de autenticación detectada; no se intentarán cargar tareas.');
      }
    } catch (err) {
      if (err && err.status === 401) {
        // Si por alguna razón recibimos 401 aquí, redirigimos
        redirectToAuth();
      } else {
        console.warn('Inicialización: posible error de red o servidor', err);
      }
    }
  })();
});