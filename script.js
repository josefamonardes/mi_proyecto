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
  const btnLogin = document.getElementById('btnLogin');

  const taskForm = document.getElementById('taskForm');
  const taskInput = document.getElementById('taskInput');
  const prioritySelect = document.getElementById('prioritySelect');
  const dueDateInput = document.getElementById('taskDueDate');
  const tasksList = document.getElementById('tasksList');
  const filterGroup = document.getElementById('filterGroup');

  // Calendario (solo existe en index.html)
  const calPrev = document.getElementById('calPrev');
  const calNext = document.getElementById('calNext');
  const calTitle = document.getElementById('calTitle');
  const calendarGrid = document.getElementById('calendarGrid');
  const calendarAddModalEl = document.getElementById('calendarAddModal');
  const calTaskDate = document.getElementById('calTaskDate');
  const calTaskTitle = document.getElementById('calTaskTitle');
  const calTaskPriority = document.getElementById('calTaskPriority');
  const calTaskTime = document.getElementById('calTaskTime');
  const calTaskSave = document.getElementById('calTaskSave');

  // ====================
  // ACCESIBILIDAD: evitar warning aria-hidden + focus en Bootstrap Modal
  // ====================
  let lastFocusedBeforeModal = null;
  if (calendarAddModalEl) {
    calendarAddModalEl.addEventListener('show.bs.modal', () => {
      lastFocusedBeforeModal = document.activeElement;
    });
    calendarAddModalEl.addEventListener('hidden.bs.modal', () => {
      // Devuelve el foco fuera del modal (evita "Blocked aria-hidden..." en Chrome)
      if (lastFocusedBeforeModal && typeof lastFocusedBeforeModal.focus === 'function') {
        lastFocusedBeforeModal.focus();
      }
      lastFocusedBeforeModal = null;
    });
  }

  // ====================
  // VARIABLES GLOBALES
  // ====================
  let tasks = [];
  let currentFilter = 'all';
  let selectedDateYMD = null; // filtro por día desde el calendario (YYYY-MM-DD)
  let currentUser = null;

  // Calendario: mes en vista
  let calCursor = new Date();
  calCursor.setHours(0, 0, 0, 0);
  calCursor.setDate(1);

  // ====================
  // UTIL: alert simple
  // ====================
  function showAlert(message, type = 'info', timeout = 4000) {
    // Muestra alertas Bootstrap si existe un contenedor #alerts (recomendado).
    // Si no existe, hace fallback a console.
    const container = document.getElementById('alerts');
    if (!container) {
      console.log(`[alert ${type}] ${message}`);
      return;
    }

    const id = `alert-${Date.now()}`;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div id="${id}" class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${escapeHtml(message)}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
    container.appendChild(wrapper);

    if (timeout && timeout > 0) {
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          // Cierra con API de bootstrap si está disponible; si no, elimina.
          try {
            const alert = bootstrap.Alert.getOrCreateInstance(el);
            alert.close();
          } catch (e) {
            el.remove();
          }
        }
      }, timeout);
    }
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
      const msg = (data && (data.message || data.error)) ? (data.message || data.error) : `HTTP ${res.status}`;
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
    if (btnLogin) btnLogin.classList.add('d-none');
    if (logoutBtn) logoutBtn.classList.remove('d-none');
  }

  function showLoggedOut() {
    currentUser = null;
    if (authSection) authSection.style.display = 'block';
    if (appSection) appSection.style.display = 'none';
    if (whoami) whoami.textContent = '';
    if (logoutBtn) logoutBtn.classList.add('d-none');
    if (btnLogin) btnLogin.classList.remove('d-none');
  }

  // ====================
  // TAREAS: render / CRUD (seguro si no existe tasksList)
  // ====================
  function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text || ''; return div.innerHTML; }

  
  function passStatusFilter(t) {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'pending') return !t.completed;
    if (currentFilter === 'completed') return !!t.completed;
    if (currentFilter === 'urgent') return String(t.priority || '').toLowerCase() === 'urgente';
    return true;
  }

  function getFilteredTasksArray(opts = { includeDate: true }) {
    const arr = Array.isArray(tasks) ? tasks : [];
    return arr.filter(t => {
      if (!passStatusFilter(t)) return false;

      if (opts.includeDate && selectedDateYMD) {
        const d = normalizeDueDate(t.due_date || t.dueDate);
        if (!d) return false;
        return toYMD(d) === selectedDateYMD;
      }
      return true;
    });
  }


  function normalizeDueDate(raw) {
    const s = String(raw || '').trim();
    if (!s) return null;
    // MySQL: 'YYYY-MM-DD HH:MM:SS' -> ISO-ish
    const isoLike = s.includes(' ') ? s.replace(' ', 'T') : s;
    const d = new Date(isoLike);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  }

  function toYMD(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function renderTasks() {
    // Si no existe el contenedor de tareas, no hacemos nada (estamos en auth.html u otra página)
    if (!tasksList) return;

    tasksList.innerHTML = '';

    const filtered = getFilteredTasksArray();

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'text-muted';
      empty.textContent = 'No hay tareas.';
      tasksList.appendChild(empty);
      // aunque no haya tareas, el calendario y el panel deben actualizarse
      renderUpcoming();
      renderCalendar();
      return;
    }

    filtered.forEach(task => {
      const item = document.createElement('div');
      // prioridad normalizada (la usa tanto el badge como los estilos CSS por data-priority)
      const prLabel = String(task.priority || 'media').toLowerCase();

      item.className = 'list-group-item task-item d-flex justify-content-between align-items-start';
      item.dataset.priority = prLabel;
      if (task.completed) item.classList.add('task-completed');

      const left = document.createElement('div');
      const prClassMap = { baja: 'text-bg-secondary', media: 'text-bg-primary', alta: 'text-bg-warning', urgente: 'text-bg-danger' };
      const prBadgeClass = prClassMap[prLabel] || 'text-bg-primary';

      // Fecha: si viene ISO o MySQL, la dejamos tal cual (tu backend ya envía ISO en la creación)
      const dueText = String(task.due_date || task.dueDate || '').trim();

      left.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <div class="fw-semibold">${escapeHtml(task.title || task.text || '')}</div>
          <span class="badge ${prBadgeClass}">${escapeHtml(prLabel)}</span>
        </div>
        <small class="text-muted">${dueText ? escapeHtml(dueText) : 'Sin fecha'}</small>
      `;
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

    // Mantén el calendario y el panel de próximas tareas sincronizados
    renderUpcoming();
    renderCalendar();
  }

  function formatShortDate(d) {
    try {
      return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(d);
    } catch { return ''; }
  }

  function renderUpcoming() {
    const box = document.getElementById('upcomingList');
    if (!box) return;

    const upcoming = (Array.isArray(tasks) ? tasks : [])
      .filter(t => !t.completed)
      .map(t => ({ t, d: normalizeDueDate(t.due_date || t.dueDate) }))
      .filter(x => x.d)
      .sort((a, b) => a.d - b.d)
      .slice(0, 6);

    box.innerHTML = '';

    if (!upcoming.length) {
      const empty = document.createElement('div');
      empty.className = 'text-muted';
      empty.style.fontSize = '.9rem';
      empty.textContent = 'No hay tareas pendientes con fecha.';
      box.appendChild(empty);
      return;
    }

    upcoming.forEach(({ t, d }) => {
      const pr = String(t.priority || 'media').toLowerCase();

      const row = document.createElement('div');
      row.className = 'list-group-item d-flex align-items-center justify-content-between';

      row.innerHTML = `
        <div class="me-2">
          <div class="fw-semibold">${escapeHtml(t.title || t.text || '')}</div>
          <div class="text-muted" style="font-size:.85rem;">
            <i class="bi bi-calendar3 me-1"></i>${escapeHtml(formatShortDate(d))}
          </div>
        </div>
        <span class="badge rounded-pill ${({"baja":"text-bg-secondary","media":"text-bg-primary","alta":"text-bg-warning","urgente":"text-bg-danger"}[pr] || "text-bg-primary")}">${escapeHtml(pr)}</span>
      `;
      box.appendChild(row);
    });
  }


  function renderCalendar() {
    if (!calendarGrid) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Title
    if (calTitle) {
      const fmt = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });
      calTitle.textContent = fmt.format(calCursor);
    }

    const year = calCursor.getFullYear();
    const month = calCursor.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Queremos semanas empezando en lunes (es-ES)
    const jsDow = firstDay.getDay(); // 0 domingo..6 sábado
    const leading = (jsDow + 6) % 7; // lunes=0

    calendarGrid.innerHTML = '';

    // Cabeceras
    const heads = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    heads.forEach(h => {
      const el = document.createElement('div');
      el.className = 'cal-head';
      el.textContent = h;
      calendarGrid.appendChild(el);
    });

    // Mapa de tareas por día
    const dayMap = new Map();
    getFilteredTasksArray({ includeDate: false }).forEach(t => {
      const d = normalizeDueDate(t.due_date || t.dueDate);
      if (!d) return;
      const key = toYMD(d);
      if (!dayMap.has(key)) dayMap.set(key, []);
      dayMap.get(key).push({ task: t, dateObj: d });
    });
    // orden por hora dentro del día
    dayMap.forEach(list => list.sort((a, b) => a.dateObj - b.dateObj));

    // celdas del mes
    const totalDays = lastDay.getDate();
    const totalCells = 42; // 6 semanas * 7

    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement('div');
      cell.className = 'cal-cell';

      const dayNum = i - leading + 1;
      const inMonth = dayNum >= 1 && dayNum <= totalDays;

      if (!inMonth) {
        cell.classList.add('is-muted');
        calendarGrid.appendChild(cell);
        continue;
      }

      const dateObj = new Date(year, month, dayNum);
      dateObj.setHours(0, 0, 0, 0);
      const ymd = toYMD(dateObj);
      cell.dataset.date = ymd;
      if (dateObj.getTime() === today.getTime()) cell.classList.add('is-today');
      if (selectedDateYMD && ymd === selectedDateYMD) cell.classList.add('is-selected');

      const top = document.createElement('div');
      top.className = 'd-flex align-items-center justify-content-between';
      top.innerHTML = `<div class="cal-daynum">${dayNum}</div>`;

      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'cal-add';
      addBtn.innerHTML = '<i class="bi bi-plus"></i>';
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openCalendarAddModal(ymd);
      });
      top.appendChild(addBtn);

      cell.appendChild(top);

      
      const items = dayMap.get(ymd) || [];
      if (items.length) {
        const markers = document.createElement('div');
        markers.className = 'cal-markers';

        const prSet = new Set();
        items.forEach(({ task }) => prSet.add(String(task.priority || 'media').toLowerCase()));

        const order = ['urgente', 'alta', 'media', 'baja'];
        order.filter(p => prSet.has(p)).forEach(pr => {
          const dot = document.createElement('span');
          dot.className = 'cal-marker';
          dot.dataset.priority = pr;
          dot.title = pr;
          markers.appendChild(dot);
        });

        const count = document.createElement('span');
        count.className = 'cal-count';
        count.textContent = items.length;
        markers.appendChild(count);

        cell.appendChild(markers);
      }

      // click en día: filtra la lista (toggle). El + sigue abriendo el modal.
      cell.addEventListener('click', () => {
        selectedDateYMD = (selectedDateYMD === ymd) ? null : ymd;
        renderTasks();
        renderCalendar();
      });

      calendarGrid.appendChild(cell);
    }
  }

  let calendarModal = null;
  function openCalendarAddModal(ymd) {
    if (!calendarAddModalEl) return;
    if (calTaskDate) calTaskDate.value = ymd;
    if (calTaskTitle) calTaskTitle.value = '';
    if (calTaskPriority) calTaskPriority.value = 'media';
    if (calTaskTime) calTaskTime.value = '12:00';

    try {
      calendarModal = calendarModal || bootstrap.Modal.getOrCreateInstance(calendarAddModalEl);
      calendarModal.show();
      setTimeout(() => calTaskTitle && calTaskTitle.focus(), 80);
    } catch (e) {
      // si bootstrap no está, hacemos fallback: rellenar el form principal
      if (dueDateInput) dueDateInput.value = `${ymd}T12:00`;
      if (taskInput) taskInput.focus();
    }
  }

  async function loadTasks() {
    if (!USE_API) {
      tasks = localLoadTasks();
      renderTasks();
      return tasks;
    }

    const res = await apiRequest('read', 'GET', null);

    // Formato esperado del backend: { ok, message, data: { tasks: [...] } }
    if (Array.isArray(res)) {
      tasks = res;
    } else if (res && Array.isArray(res.tasks)) {
      tasks = res.tasks;
    } else if (res && res.data && Array.isArray(res.data.tasks)) {
      tasks = res.data.tasks;
    } else if (res && res.data && Array.isArray(res.data)) {
      tasks = res.data;
    } else {
      tasks = [];
    }

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

    // Formato esperado: { ok, message, data: { task: {...} } }
    const created = res?.data?.task || res?.task || null;
    if (created) return created;

    // Si el backend devolvió OK pero sin task, lo tratamos como error de contrato.
    throw new Error('La API no devolvió la tarea creada');
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
// Validaciones cliente
if (!isValidUsername(username)) {
  showAlert('Usuario inválido: usa 3-20 caracteres (letras/números y . _ -).', 'warning');
  return;
}
if (!isValidEmail(email)) {
  showAlert('Email inválido.', 'warning');
  return;
}
if (!isStrongPassword(password)) {
  showAlert('Contraseña débil: mínimo 8 caracteres con mayúscula, minúscula y número.', 'warning');
  return;
}

      try {
        const res = await registerUser(username, email, password);
        if (res && res.ok) {
          // redirigir a la app principal
          window.location.href = 'index.html';
        } else {
          showAlert((res && (res.message || res.error)) || 'Error en registro', 'danger');
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
// Validaciones cliente (identifier puede ser email o username)
if (!identifier) {
  showAlert('Introduce tu email o usuario.', 'warning');
  return;
}
if (identifier.includes('@') && !isValidEmail(identifier)) {
  showAlert('Email inválido.', 'warning');
  return;
}
if (!password || password.length < 8) {
  // no forces la política completa en login, pero mínimo razonable
  showAlert('La contraseña debe tener al menos 8 caracteres.', 'warning');
  return;
}

      try {
        const res = await loginUser(identifier, password);
        if (res && res.ok) {
          // redirigir a la app principal
          window.location.href = 'index.html';
        } else {
          showAlert((res && (res.message || res.error)) || 'Credenciales inválidas', 'danger');
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

      // Enviamos al backend solo lo que necesita (evita desalineaciones de contrato)
      const task = {
        title: text,
        priority,
        due_date: dueDate,
        completed: 0
      };

      try {
        const saved = await saveTask(task);
        if (!Array.isArray(tasks)) tasks = [];
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

  // Calendario: navegación de mes
  if (calPrev) {
    calPrev.addEventListener('click', () => {
      calCursor = new Date(calCursor.getFullYear(), calCursor.getMonth() - 1, 1);
      calCursor.setHours(0, 0, 0, 0);
      renderCalendar();
    });
  }

  if (calNext) {
    calNext.addEventListener('click', () => {
      calCursor = new Date(calCursor.getFullYear(), calCursor.getMonth() + 1, 1);
      calCursor.setHours(0, 0, 0, 0);
      renderCalendar();
    });
  }

  // Calendario: guardar tarea desde modal
  if (calTaskSave) {
    calTaskSave.addEventListener('click', async () => {
      const ymd = (calTaskDate && calTaskDate.value || '').trim();
      const title = (calTaskTitle && calTaskTitle.value || '').trim();
      const priority = (calTaskPriority && calTaskPriority.value) || 'media';
      const time = (calTaskTime && calTaskTime.value) || '12:00';

      if (!title) {
        showAlert('⚠️ Escribe un título para la tarea', 'warning');
        calTaskTitle && calTaskTitle.focus();
        return;
      }

      const due_date = ymd ? `${ymd}T${time}` : null;
      const task = { title, priority, due_date, completed: 0 };

      try {
        const saved = await saveTask(task);
        if (!Array.isArray(tasks)) tasks = [];
        tasks.push(saved);
        renderTasks();
        showAlert('✅ Tarea añadida desde el calendario', 'success');

        try {
          const modal = bootstrap.Modal.getOrCreateInstance(calendarAddModalEl);
          if (document.activeElement) document.activeElement.blur();
          modal.hide();
        } catch (e) {
          // ignore
        }
      } catch (err) {
        if (err && err.status === 401) {
          showAlert('Necesitas iniciar sesión para crear tareas', 'warning');
          redirectToAuth();
          return;
        }
        showAlert(err.message || 'Error al guardar tarea', 'danger');
      }
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
            if (who && who.ok && who.data && who.data.user) {
              console.log('✅ whoami:', who.data.user);
              showLoggedIn(who.data.user.username || '');
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

// ===== Validación cliente (registro) =====
const regForm = document.getElementById('registerForm');
if (regForm) {
  regForm.addEventListener('submit', (e) => {
    const username = document.getElementById('reg_username').value.trim();
    const email = document.getElementById('reg_email').value.trim();
    const password = document.getElementById('reg_password').value;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const strongPass =
      password.length >= 8 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password);

    if (username.length < 3) {
      alert('El usuario debe tener al menos 3 caracteres');
      e.preventDefault();
      return;
    }

    if (!emailRegex.test(email)) {
      alert('Email no válido');
      e.preventDefault();
      return;
    }

    if (!strongPass) {
      alert('La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula y número');
      e.preventDefault();
    }
  });
}


/*
| Validaciones en cliente (Unidad 2/3)
*/
function isValidEmail(email) {
  // Suficiente para validación básica de formulario
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUsername(username) {
  return typeof username === 'string'
    && username.length >= 3
    && username.length <= 20
    && /^[a-zA-Z0-9._-]+$/.test(username);
}

function isStrongPassword(password) {
  return typeof password === 'string'
    && password.length >= 8
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /[0-9]/.test(password);
}

