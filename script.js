// script.js - Versión final integrada
// - Combina la antigua versión completa (UI avanzada, localStorage fallback, filtros, progreso)
//   con las nuevas funciones de autenticación (register/login/logout) y uso de sesiones PHP.
// - No debe interferir con formularios cliente: si los formularios de auth no existen, el código los ignora.
// - Asegúrate de que tu backend usa los endpoints:
//     /mi_proyecto/api/tasks/*.php
//     /mi_proyecto/api/auth/*.php
// - Las peticiones que usan sesiones envían cookies: credentials: 'include'

document.addEventListener('DOMContentLoaded', function() {
  // ====================
  // CONFIGURACIÓN
  // ====================
  const API_BASE_URL = '/mi_proyecto/api/tasks'; // endpoint de tareas
  const AUTH_BASE_URL = '/mi_proyecto/api/auth'; // endpoint auth
  const USE_API = true; // Cambiar a false para usar solo localStorage

  // ====================
  // SELECTORES DOM
  // ====================
  const taskForm = document.getElementById('taskForm');
  const taskInput = document.getElementById('taskInput');
  const prioritySelect = document.getElementById('prioritySelect');
  const dueDateInput = document.getElementById('taskDueDate');
  const taskList = document.getElementById('taskList');
  const emptyMessage = document.getElementById('emptyMessage');
  const totalTasksSpan = document.getElementById('totalTasks');
  const completedTasksSpan = document.getElementById('completedTasks');
  const upcomingAlert = document.getElementById('upcomingAlert');
  const upcomingCount = document.getElementById('upcomingCount');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const progressBar = document.getElementById('progressBar');
  const mainProgressBar = document.getElementById('mainProgressBar');
  const sidebarTotalTasks = document.getElementById('sidebarTotalTasks');
  const sidebarCompletedTasks = document.getElementById('sidebarCompletedTasks');
  const upcomingTasksList = document.getElementById('upcomingTasksList');

  // Auth elements (optional)
  const registerForm = document.getElementById('registerForm');
  const loginForm = document.getElementById('loginForm');
  const logoutBtn = document.getElementById('logoutBtn');
  const authSection = document.getElementById('authSection');
  const appSection = document.getElementById('appSection');
  const whoami = document.getElementById('whoami');

  // ====================
  // VARIABLES GLOBALES
  // ====================
  let tasks = [];
  let currentFilter = 'all';
  let currentUser = null;

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
    const options = { method };

    if (method === 'GET' && data) {
      url += `?${new URLSearchParams(data).toString()}`;
    } else if (data) {
      options.body = data; // fetchJson hará stringify si es necesario
    }

    try {
      const result = await fetchJson(url, options);
      // Compatibilidad con varios formatos de respuesta
      // puede venir { tasks: [...] } o { data: [...] } o { task: {...} }
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
    const options = { method };
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
  // LOCALSTORAGE helpers
  // ====================
  function localLoadTasks() {
    return JSON.parse(localStorage.getItem('taskflow_tasks') || '[]');
  }
  function localSaveTasksArray(arr) {
    localStorage.setItem('taskflow_tasks', JSON.stringify(arr));
  }

  // ====================
  // CRUD (save/update/delete) con fallback
  // ====================
  async function saveTask(task) {
    if (USE_API) {
      try {
        const payload = {
          title: task.text || task.title,
          description: task.description || '',
          priority: task.priority || 'media',
          due_date: task.dueDate || task.due_date || null,
          completed: task.completed ? 1 : 0
        };
        const res = await apiRequest('create', 'POST', payload);
        const created = res.task || res.data || res;
        return Object.assign({}, task, created);
      } catch (err) {
        console.warn('saveTask: fallback local por error API', err);
        // si la API falla por 401 (no autenticado) propagamos para que UI actúe
        if (err.status === 401) throw err;
      }
    }
    // fallback local
    const arr = localLoadTasks();
    arr.push(task);
    localSaveTasksArray(arr);
    return task;
  }

  async function updateTask(task) {
    if (USE_API) {
      try {
        const payload = {
          id: task.id,
          title: task.text || task.title,
          description: task.description || '',
          priority: task.priority || 'media',
          due_date: task.dueDate || task.due_date || null,
          completed: task.completed ? 1 : 0
        };
        await apiRequest('update', 'PUT', payload);
        return true;
      } catch (err) {
        console.warn('updateTask fallo, fallback local', err);
        if (err.status === 401) throw err;
      }
    }
    // fallback local update
    const all = localLoadTasks();
    const updated = all.map(t => (t.id == task.id ? task : t));
    localSaveTasksArray(updated);
    return true;
  }

  async function deleteTaskRemote(taskId) {
    if (USE_API) {
      try {
        await apiRequest('delete', 'DELETE', { id: taskId });
        return true;
      } catch (err) {
        console.warn('deleteTaskRemote DELETE fallo, probando fallbacks', err);
        try {
          await apiRequest('delete', 'POST', { id: taskId });
          return true;
        } catch (err2) {
          console.warn('deleteTaskRemote POST fallo, probando GET', err2);
          try {
            await apiRequest('delete', 'GET', { id: taskId });
            return true;
          } catch (err3) {
            console.warn('deleteTaskRemote: todos los fallbacks fallaron', err3);
          }
        }
      }
    }
    // fallback local
    const all = localLoadTasks();
    const filtered = all.filter(t => t.id != taskId);
    localSaveTasksArray(filtered);
    return true;
  }

  // ====================
  // FUNCIONES PRINCIPALES
  // ====================
  async function addTask() {
    const text = taskInput.value.trim();
    const priority = prioritySelect.value;
    const dueDate = dueDateInput.value || null;

    if (!text) {
      showAlert('⚠️ Escribe una tarea primero', 'warning');
      taskInput.focus();
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
      resetForm();
      showAlert('✅ Tarea añadida correctamente', 'success');
    } catch (err) {
      if (err.status === 401) {
        showAlert('Necesitas iniciar sesión para crear tareas', 'warning');
        showLoggedOut();
        return;
      }
      showAlert('❌ Error al guardar la tarea', 'danger');
    }
  }

  async function loadTasks() {
    if (USE_API) {
      try {
        const res = await apiRequest('read', 'GET');
        // Puede venir en res.tasks, res.data o res
        tasks = res.tasks || res.data || (Array.isArray(res) ? res : []);
      } catch (err) {
        // fallback local
        tasks = localLoadTasks();
        if (tasks.length > 0) showAlert('Usando datos locales (API no disponible)', 'info');
        if (err && err.status === 401) {
          // no autenticado: mostrar UI correspondiente
          showLoggedOut();
          throw err;
        }
      }
    } else {
      tasks = localLoadTasks();
    }
    renderTasks();
    updateStats();
    updateUpcomingAlert();
    updateUpcomingTasksList();
    return tasks;
  }

  async function toggleTaskComplete(taskId, completed) {
    const idx = tasks.findIndex(t => t.id == taskId);
    if (idx === -1) return;
    tasks[idx].completed = completed ? 1 : 0;
    try {
      await updateTask(tasks[idx]);
      renderTasks();
      showAlert(`✅ Tarea ${completed ? 'completada' : 'pendiente'}`, 'success');
    } catch (err) {
      if (err.status === 401) {
        showAlert('Necesitas iniciar sesión para actualizar tareas', 'warning');
        showLoggedOut();
        return;
      }
      showAlert('❌ Error al actualizar la tarea', 'danger');
    }
  }

  async function deleteTaskHandler(taskId) {
    console.log('🗑️ Intentando eliminar tarea ID:', taskId);
    if (!confirm('¿Estás seguro de que quieres eliminar esta tarea?')) return;
    try {
      const ok = await deleteTaskRemote(taskId);
      if (ok) {
        tasks = tasks.filter(t => t.id != taskId);
        renderTasks();
        showAlert('✅ Tarea eliminada correctamente', 'success');
      } else {
        // fallback local already performed in deleteTaskRemote
        tasks = tasks.filter(t => t.id != taskId);
        renderTasks();
        showAlert('⚠️ Tarea eliminada solo localmente (API no disponible)', 'warning');
      }
    } catch (err) {
      // If auth error
      if (err.status === 401) {
        showAlert('Necesitas iniciar sesión para eliminar tareas', 'warning');
        showLoggedOut();
        return;
      }
      showAlert('❌ Error al eliminar la tarea', 'danger');
    }
  }

  function openEditModal(taskId) {
    const task = tasks.find(t => t.id == taskId);
    if (!task) return;
    const newText = prompt('Editar tarea:', task.text || task.title);
    if (newText !== null && newText.trim() !== '') {
      task.text = newText.trim();
      task.title = newText.trim();
      updateTask(task).then(() => {
        renderTasks();
        showAlert('✏️ Tarea actualizada', 'success');
      }).catch((err) => {
        if (err && err.status === 401) {
          showAlert('Necesitas iniciar sesión para editar tareas', 'warning');
          showLoggedOut();
        } else {
          showAlert('❌ Error al actualizar', 'danger');
        }
      });
    }
  }

  // ====================
  // RENDER / UI helpers
  // ====================
  function renderTasks() {
    if (!taskList) return;
    taskList.innerHTML = '';

    let filtered = tasks.slice();
    switch (currentFilter) {
      case 'pending': filtered = tasks.filter(t => !t.completed); break;
      case 'completed': filtered = tasks.filter(t => t.completed); break;
      case 'urgent': filtered = tasks.filter(t => t.priority === 'urgente' && !t.completed); break;
    }

    filtered.sort((a, b) => {
      if (+a.completed !== +b.completed) return +a.completed ? 1 : -1;
      const order = { 'urgente': 1, 'alta': 2, 'media': 3, 'baja': 4 };
      if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
      if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      return new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at);
    });

    if (filtered.length === 0) {
      if (emptyMessage) emptyMessage.style.display = 'block';
    } else {
      if (emptyMessage) emptyMessage.style.display = 'none';
      filtered.forEach(task => {
        const el = createTaskElement(task);
        taskList.appendChild(el);
      });
    }
    updateStats();
    updateUpcomingAlert();
    updateUpcomingTasksList();
  }

  function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = 'list-group-item task-item';
    div.dataset.id = task.id;
    div.dataset.priority = task.priority || 'media';

    const dateClasses = getDateStatusClasses(task.dueDate || task.due_date, !!+task.completed);

    const priorityColors = { 'baja': 'secondary', 'media': 'success', 'alta': 'warning', 'urgente': 'danger' };
    const priorityTexts = { 'baja': 'Baja', 'media': 'Media', 'alta': 'Alta', 'urgente': 'Urgente' };
    const priorityColor = priorityColors[task.priority] || 'secondary';
    const priorityText = priorityTexts[task.priority] || 'Media';

    let dueDateHtml = '';
    if (task.dueDate || task.due_date) {
      const dueDate = new Date(task.dueDate || task.due_date);
      const formattedDueDate = dueDate.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
      const timeLeft = getTimeLeft(dueDate);
      dueDateHtml = `
        <div class="mt-1">
          <span class="badge ${dateClasses.badgeClass} date-badge">
            <i class="bi bi-calendar${dateClasses.icon}"></i> ${timeLeft}
          </span>
          <small class="text-muted ms-2">${formattedDueDate}</small>
        </div>
      `;
    }

    const createdDate = new Date(task.createdAt || task.created_at || Date.now());
    const formattedCreatedDate = createdDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

    div.innerHTML = `
      <div class="d-flex justify-content-between align-items-center ${dateClasses.taskClass}">
        <div class="d-flex align-items-center" style="flex-grow:1;">
          <div class="form-check me-3">
            <input class="form-check-input task-checkbox" type="checkbox" id="task-${task.id}" ${+task.completed ? 'checked' : ''}>
          </div>
          <div style="flex-grow:1;">
            <div class="d-flex align-items-center">
              <label class="form-check-label ${+task.completed ? 'task-completed' : ''}" for="task-${task.id}">
                ${escapeHtml(task.text || task.title || '')}
              </label>
              <span class="badge bg-${priorityColor} priority-badge ms-2">${priorityText}</span>
            </div>
            ${dueDateHtml}
            <small class="text-muted"><i class="bi bi-clock"></i> Creada: ${formattedCreatedDate}</small>
            ${+task.completed ? `<small class="text-success ms-2"><i class="bi bi-check-circle"></i> Completada</small>` : ''}
          </div>
        </div>
        <div class="btn-group" role="group">
          <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${task.id}" title="Editar tarea"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${task.id}" title="Eliminar tarea"><i class="bi bi-trash"></i></button>
        </div>
      </div>
    `;

    if (dateClasses.taskClass) {
      const inner = div.querySelector('.d-flex.justify-content-between');
      if (inner) inner.classList.add(...dateClasses.taskClass.split(' ').filter(Boolean));
    }

    addTaskEvents(div, task.id);
    return div;
  }

  function addTaskEvents(taskElement, taskId) {
    const checkbox = taskElement.querySelector('.task-checkbox');
    const editBtn = taskElement.querySelector('.edit-btn');
    const deleteBtn = taskElement.querySelector('.delete-btn');

    if (checkbox) checkbox.addEventListener('change', async () => await toggleTaskComplete(taskId, checkbox.checked));
    if (editBtn) editBtn.addEventListener('click', () => openEditModal(taskId));
    if (deleteBtn) deleteBtn.addEventListener('click', async () => await deleteTaskHandler(taskId));
  }

  // ====================
  // UTIL / FECHA / STATS
  // ====================
  function getDateStatusClasses(dueDateISO, isCompleted) {
    if (!dueDateISO || isCompleted) return { taskClass: '', badgeClass: 'bg-secondary', icon: '' };
    const now = new Date();
    const dueDate = new Date(dueDateISO);
    const diffTime = dueDate - now;
    if (diffTime < 0) return { taskClass: 'task-overdue', badgeClass: 'date-overdue', icon: '-exclamation' };
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return { taskClass: 'task-due-soon', badgeClass: 'date-today', icon: '-event' };
    if (diffDays === 1) return { taskClass: '', badgeClass: 'date-tomorrow', icon: '-event' };
    if (diffDays <= 3) return { taskClass: '', badgeClass: 'bg-warning', icon: '-event' };
    return { taskClass: '', badgeClass: 'bg-info', icon: '' };
  }

  function getTimeLeft(dueDate) {
    const now = new Date();
    const diffTime = dueDate - now;
    if (diffTime < 0) return 'VENCIDA';
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (diffDays === 0) {
      if (diffHours === 0) {
        const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
        return `En ${diffMinutes} min`;
      }
      return `Hoy en ${diffHours}h`;
    } else if (diffDays === 1) return 'Mañana';
    else if (diffDays <= 7) return `En ${diffDays} días`;
    return `${diffDays} días`;
  }

  function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => +t.completed).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    if (totalTasksSpan) totalTasksSpan.textContent = total;
    if (completedTasksSpan) completedTasksSpan.textContent = completed;
    if (sidebarTotalTasks) sidebarTotalTasks.textContent = total;
    if (sidebarCompletedTasks) sidebarCompletedTasks.textContent = completed;
    if (progressBar) { progressBar.style.width = `${progress}%`; progressBar.setAttribute('aria-valuenow', progress); }
    if (mainProgressBar) { mainProgressBar.style.width = `${progress}%`; mainProgressBar.textContent = `${progress}%`; }
  }

  function updateUpcomingAlert() {
    if (!upcomingAlert) return;
    const now = new Date();
    const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
    const upcoming = tasks.filter(task => { if (+task.completed || !(task.dueDate || task.due_date)) return false; const d = new Date(task.dueDate || task.due_date); return d >= now && d <= tomorrow; });
    if (upcoming.length > 0) { upcomingAlert.style.display = 'flex'; upcomingCount.textContent = upcoming.length; } else { upcomingAlert.style.display = 'none'; }
  }

  function updateUpcomingTasksList() {
    if (!upcomingTasksList) return;
    const now = new Date(); const nextWeek = new Date(now); nextWeek.setDate(nextWeek.getDate() + 7);
    const upcoming = tasks.filter(task => { if (+task.completed || !(task.dueDate || task.due_date)) return false; const d = new Date(task.dueDate || task.due_date); return d >= now && d <= nextWeek; }).sort((a,b) => new Date(a.dueDate||a.due_date) - new Date(b.dueDate||b.due_date));
    upcomingTasksList.innerHTML = '';
    if (upcoming.length === 0) {
      upcomingTasksList.innerHTML = `<li class="list-group-item border-0 text-muted"><i class="bi bi-info-circle me-2"></i>No hay tareas próximas</li>`;
      return;
    }
    upcoming.slice(0,5).forEach(task => {
      const due = new Date(task.dueDate || task.due_date);
      const formatted = due.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' });
      const li = document.createElement('li');
      li.className = 'list-group-item border-0';
      li.innerHTML = `<div class="d-flex justify-content-between align-items-center"><div style="max-width:70%"><small class="d-block text-truncate ${+task.completed ? 'task-completed' : ''}">${escapeHtml(task.text || task.title)}</small><small class="text-muted">${formatted}</small></div><span class="badge ${task.priority === 'urgente' ? 'bg-danger' : 'bg-warning'}">${getTimeLeft(due)}</span></div>`;
      upcomingTasksList.appendChild(li);
    });
  }

  function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.style.cssText = `position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);`;
    const icon = type === 'success' ? 'bi-check-circle' : type === 'warning' ? 'bi-exclamation-triangle' : type === 'danger' ? 'bi-x-circle' : 'bi-info-circle';
    alertDiv.innerHTML = `<div class="d-flex align-items-center"><i class="bi ${icon} me-2"></i><span>${message}</span><button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button></div>`;
    document.body.appendChild(alertDiv);
    setTimeout(() => { if (alertDiv.parentNode) alertDiv.remove(); }, 4000);
  }

  function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text || ''; return div.innerHTML; }

  function resetForm() {
    if (taskInput) taskInput.value = '';
    if (prioritySelect) prioritySelect.value = 'media';
    if (dueDateInput) {
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(12,0,0,0);
      dueDateInput.value = tomorrow.toISOString().slice(0,16);
    }
    if (taskInput) taskInput.focus();
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
  // EVENT LISTENERS
  // ====================
  if (taskForm) {
    taskForm.addEventListener('submit', function(e) { e.preventDefault(); addTask(); });
  }

  if (filterButtons) {
    filterButtons.forEach(button => {
      button.addEventListener('click', function() {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.dataset.filter || 'all';
        renderTasks();
      });
    });
  }

  if (dueDateInput) {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(12,0,0,0);
    dueDateInput.min = new Date().toISOString().slice(0,16);
    dueDateInput.value = tomorrow.toISOString().slice(0,16);
  }

  // Auth forms (if present) — they won't break anything if absent
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = registerForm.username.value.trim();
      const email = registerForm.email.value.trim();
      const password = registerForm.password.value;
      try {
        const res = await registerUser(username, email, password);
        if (res && res.success) {
          showLoggedIn(res.user.username);
          await loadTasks();
        } else showAlert(res.error || 'Error en registro', 'danger');
      } catch (err) {
        showAlert(err.message || 'Error en registro', 'danger');
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const identifier = loginForm.identifier.value.trim();
      const password = loginForm.password.value;
      try {
        const res = await loginUser(identifier, password);
        if (res && res.success) {
          showLoggedIn(res.user.username);
          await loadTasks();
        } else showAlert(res.error || 'Credenciales inválidas', 'danger');
      } catch (err) {
        showAlert(err.message || 'Error en login', 'danger');
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await logoutUser();
      } catch (e) { /* ignore */ }
      showLoggedOut();
    });
  }

  // ====================
  // INICIALIZACIÓN
  // ====================
  console.log('🚀 TaskFlow iniciando...');
  // Intentamos cargar tareas — si la API responde 401, dejamos el estado no autenticado y usamos local
  (async () => {
    try {
      await loadTasks();
      // Si hay tareas desde el servidor, asumimos sesión activa (puedes mejorar con endpoint whoami)
      if (tasks && tasks.length >= 0) {
        showLoggedIn(''); // no username available without whoami endpoint
      }
    } catch (err) {
      if (err && err.status === 401) {
        showLoggedOut();
      } else {
        console.warn('Inicialización: posible error de red o servidor', err);
      }
    }

    // Recordatorio diario (después de 2s)
    setTimeout(() => {
      const today = new Date();
      const todayTasks = tasks.filter(task => { if (+task.completed || !(task.dueDate || task.due_date)) return false; const d = new Date(task.dueDate || task.due_date); return d.toDateString() === today.toDateString(); });
      if (todayTasks.length > 0) showAlert(`📅 Tienes ${todayTasks.length} tarea(s) para hoy`, 'info');
    }, 2000);
  })();

});