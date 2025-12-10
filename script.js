// script.js - VERSIÓN COMPLETA CON API PHP/MySQL

document.addEventListener('DOMContentLoaded', function() {
    // ====================
    // CONFIGURACIÓN
    // ====================
    const API_BASE_URL = 'http://localhost/mi_proyecto/api/tasks';
    const USE_API = true; // Cambiar a false para usar solo localStorage
    
    // ====================
    // ELEMENTOS DEL DOM
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
    
    // ====================
    // VARIABLES GLOBALES
    // ====================
    let tasks = [];
    let currentFilter = 'all';
    
    // ====================
    // FUNCIONES DE LA API
    // ====================
    
    // Función general para peticiones a la API
    async function apiRequest(endpoint, method = 'GET', data = null) {
        if (!USE_API) {
            throw new Error('API deshabilitada - usando modo local');
        }
        
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/${endpoint}.php`, options);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Error en la API');
            }
            
            return result;
        } catch (error) {
            console.error(`Error API (${endpoint}):`, error);
            showAlert(`⚠️ Error API: ${error.message}`, 'warning');
            throw error;
        }
    }
    
    // Cargar tareas desde API o localStorage
    async function loadTasks() {
        if (USE_API) {
            try {
                const result = await apiRequest('read');
                tasks = result.data || [];
                showAlert(`✅ ${tasks.length} tareas cargadas desde el servidor`, 'success');
            } catch (error) {
                // Fallback a localStorage
                tasks = JSON.parse(localStorage.getItem('taskflow_tasks')) || [];
                if (tasks.length > 0) {
                    showAlert('Usando datos locales (API no disponible)', 'info');
                }
            }
        } else {
            tasks = JSON.parse(localStorage.getItem('taskflow_tasks')) || [];
        }
        
        renderTasks();
        updateStats();
        updateUpcomingAlert();
    }
    
    // Guardar tarea en API o localStorage
    async function saveTask(task) {
        if (USE_API) {
            try {
                const result = await apiRequest('create', 'POST', {
                    title: task.text,
                    description: task.description || '',
                    priority: task.priority,
                    due_date: task.dueDate || null,
                    completed: task.completed || false
                });
                
                if (result.task) {
                    return { ...task, ...result.task };
                }
            } catch (error) {
                // Continuar para guardar en localStorage
            }
        }
        
        // Guardar en localStorage (fallback o modo local)
        const tasks = JSON.parse(localStorage.getItem('taskflow_tasks')) || [];
        tasks.push(task);
        localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
        return task;
    }
    
    // Actualizar tarea en API o localStorage
    async function updateTask(task) {
        if (USE_API) {
            try {
                await apiRequest('update', 'PUT', {
                    id: task.id,
                    title: task.text,
                    description: task.description || '',
                    priority: task.priority,
                    due_date: task.dueDate || null,
                    completed: task.completed
                });
                return true;
            } catch (error) {
                // Continuar para actualizar en localStorage
            }
        }
        
        // Actualizar en localStorage
        const allTasks = JSON.parse(localStorage.getItem('taskflow_tasks')) || [];
        const updatedTasks = allTasks.map(t => t.id === task.id ? task : t);
        localStorage.setItem('taskflow_tasks', JSON.stringify(updatedTasks));
        return true;
    }
    
    // Eliminar tarea de API o localStorage
    async function deleteTask(taskId) {
        if (USE_API) {
            try {
                await apiRequest('delete', 'DELETE', { id: taskId });
                return true;
            } catch (error) {
                // Continuar para eliminar de localStorage
            }
        }
        
        // Eliminar de localStorage
        const allTasks = JSON.parse(localStorage.getItem('taskflow_tasks')) || [];
        const filteredTasks = allTasks.filter(t => t.id !== taskId);
        localStorage.setItem('taskflow_tasks', JSON.stringify(filteredTasks));
        return true;
    }
    
    // ====================
    // FUNCIONES PRINCIPALES
    // ====================
    
    // Añadir nueva tarea
    async function addTask() {
        const text = taskInput.value.trim();
        const priority = prioritySelect.value;
        const dueDate = dueDateInput.value;
        
        // Validación
        if (!text) {
            showAlert('⚠️ Escribe una tarea primero', 'warning');
            taskInput.focus();
            return;
        }
        
        // Crear objeto tarea
        const task = {
            id: Date.now(), // Temporal, la API asignará uno real
            text: text,
            description: '',
            priority: priority,
            dueDate: dueDate || null,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        try {
            // Guardar tarea
            const savedTask = await saveTask(task);
            
            // Añadir al array local
            tasks.push(savedTask);
            
            // Renderizar y limpiar formulario
            renderTasks();
            resetForm();
            
            showAlert('✅ Tarea añadida correctamente', 'success');
            
        } catch (error) {
            showAlert('❌ Error al guardar la tarea', 'danger');
        }
    }
    
    // Renderizar todas las tareas
    function renderTasks() {
        // Limpiar lista
        taskList.innerHTML = '';
        
        // Filtrar tareas según el filtro actual
        let filteredTasks = tasks;
        switch(currentFilter) {
            case 'pending':
                filteredTasks = tasks.filter(t => !t.completed);
                break;
            case 'completed':
                filteredTasks = tasks.filter(t => t.completed);
                break;
            case 'urgent':
                filteredTasks = tasks.filter(t => t.priority === 'urgente' && !t.completed);
                break;
        }
        
        // Ordenar tareas
        filteredTasks.sort((a, b) => {
            // Primero no completadas
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            
            // Luego por prioridad
            const priorityOrder = { 'urgente': 1, 'alta': 2, 'media': 3, 'baja': 4 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            
            // Luego por fecha
            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate) - new Date(b.dueDate);
            }
            
            // Sin fecha al final
            if (a.dueDate && !b.dueDate) return -1;
            if (!a.dueDate && b.dueDate) return 1;
            
            // Por fecha de creación
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        // Crear elementos HTML
        if (filteredTasks.length === 0) {
            emptyMessage.style.display = 'block';
        } else {
            emptyMessage.style.display = 'none';
            filteredTasks.forEach(task => {
                const taskElement = createTaskElement(task);
                taskList.appendChild(taskElement);
            });
        }
        
        updateStats();
        updateUpcomingAlert();
        updateUpcomingTasksList();
    }
    
    // Crear elemento HTML para una tarea
    function createTaskElement(task) {
        const div = document.createElement('div');
        div.className = 'list-group-item task-item';
        div.dataset.id = task.id;
        div.dataset.priority = task.priority;
        
        // Determinar clases CSS según fecha
        const dateClasses = getDateStatusClasses(task.dueDate, task.completed);
        
        // Mapeo de colores para prioridades
        const priorityColors = {
            'baja': 'secondary',
            'media': 'success',
            'alta': 'warning',
            'urgente': 'danger'
        };
        
        const priorityTexts = {
            'baja': 'Baja',
            'media': 'Media',
            'alta': 'Alta',
            'urgente': 'Urgente'
        };
        
        const priorityColor = priorityColors[task.priority];
        const priorityText = priorityTexts[task.priority];
        
        // Formatear fecha si existe
        let dueDateHtml = '';
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            const formattedDueDate = dueDate.toLocaleDateString('es-ES', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
            
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
        
        // Fecha de creación
        const createdDate = new Date(task.createdAt || task.created_at);
        const formattedCreatedDate = createdDate.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        // HTML de la tarea
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-center ${dateClasses.taskClass}">
                <div class="d-flex align-items-center" style="flex-grow: 1;">
                    <div class="form-check me-3">
                        <input class="form-check-input task-checkbox" 
                               type="checkbox" 
                               id="task-${task.id}"
                               ${task.completed ? 'checked' : ''}>
                    </div>
                    <div style="flex-grow: 1;">
                        <div class="d-flex align-items-center">
                            <label class="form-check-label ${task.completed ? 'task-completed' : ''}" 
                                   for="task-${task.id}">
                                ${escapeHtml(task.text || task.title)}
                            </label>
                            <span class="badge bg-${priorityColor} priority-badge ms-2">
                                ${priorityText}
                            </span>
                        </div>
                        ${dueDateHtml}
                        <small class="text-muted">
                            <i class="bi bi-clock"></i> Creada: ${formattedCreatedDate}
                        </small>
                        ${task.completed ? 
                            `<small class="text-success ms-2">
                                <i class="bi bi-check-circle"></i> Completada
                            </small>` : ''}
                    </div>
                </div>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary edit-btn" 
                            data-id="${task.id}"
                            title="Editar tarea">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" 
                            data-id="${task.id}"
                            title="Eliminar tarea">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Añadir clases CSS según estado de fecha
        if (dateClasses.taskClass) {
            const innerDiv = div.querySelector('.d-flex.justify-content-between');
            innerDiv.classList.add(...dateClasses.taskClass.split(' '));
        }
        
        // Añadir event listeners
        addTaskEvents(div, task.id);
        
        return div;
    }
    
    // Añadir eventos a un elemento de tarea
    function addTaskEvents(taskElement, taskId) {
        const checkbox = taskElement.querySelector('.task-checkbox');
        const editBtn = taskElement.querySelector('.edit-btn');
        const deleteBtn = taskElement.querySelector('.delete-btn');
        
        checkbox.addEventListener('change', async () => {
            await toggleTaskComplete(taskId, checkbox.checked);
        });
        
        editBtn.addEventListener('click', () => {
            openEditModal(taskId);
        });
        
        deleteBtn.addEventListener('click', async () => {
            await deleteTaskHandler(taskId);
        });
    }
    
    // Cambiar estado de completado
    async function toggleTaskComplete(taskId, completed) {
        const taskIndex = tasks.findIndex(t => t.id == taskId);
        
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = completed;
            
            try {
                await updateTask(tasks[taskIndex]);
                renderTasks();
                showAlert(`✅ Tarea ${completed ? 'completada' : 'pendiente'}`, 'success');
            } catch (error) {
                showAlert('❌ Error al actualizar la tarea', 'danger');
            }
        }
    }
    
    // Eliminar tarea
    async function deleteTaskHandler(taskId) {
        if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
            try {
                await deleteTask(taskId);
                tasks = tasks.filter(t => t.id != taskId);
                renderTasks();
                showAlert('🗑️ Tarea eliminada', 'info');
            } catch (error) {
                showAlert('❌ Error al eliminar la tarea', 'danger');
            }
        }
    }
    
    // Abrir modal de edición
    function openEditModal(taskId) {
        const task = tasks.find(t => t.id == taskId);
        if (!task) return;
        
        // Para simplificar, recargar la página con modo edición
        // En una versión avanzada, crearías un modal de edición
        const newText = prompt('Editar tarea:', task.text || task.title);
        
        if (newText !== null && newText.trim() !== '') {
            task.text = newText.trim();
            task.title = newText.trim(); // Para compatibilidad con API
            
            updateTask(task).then(() => {
                renderTasks();
                showAlert('✏️ Tarea actualizada', 'success');
            }).catch(() => {
                showAlert('❌ Error al actualizar', 'danger');
            });
        }
    }
    
    // ====================
    // FUNCIONES DE UTILIDAD
    // ====================
    
    // Determinar estado de fecha
    function getDateStatusClasses(dueDateISO, isCompleted) {
        if (!dueDateISO || isCompleted) {
            return { taskClass: '', badgeClass: 'bg-secondary', icon: '' };
        }
        
        const now = new Date();
        const dueDate = new Date(dueDateISO);
        const diffTime = dueDate - now;
        
        if (diffTime < 0) {
            return { 
                taskClass: 'task-overdue', 
                badgeClass: 'date-overdue', 
                icon: '-exclamation' 
            };
        }
        
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return { 
                taskClass: 'task-due-soon', 
                badgeClass: 'date-today', 
                icon: '-event' 
            };
        } else if (diffDays === 1) {
            return { 
                taskClass: '', 
                badgeClass: 'date-tomorrow', 
                icon: '-event' 
            };
        } else if (diffDays <= 3) {
            return { 
                taskClass: '', 
                badgeClass: 'bg-warning', 
                icon: '-event' 
            };
        }
        
        return { 
            taskClass: '', 
            badgeClass: 'bg-info', 
            icon: '' 
        };
    }
    
    // Tiempo restante
    function getTimeLeft(dueDate) {
        const now = new Date();
        const diffTime = dueDate - now;
        
        if (diffTime < 0) {
            return 'VENCIDA';
        }
        
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (diffDays === 0) {
            if (diffHours === 0) {
                const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
                return `En ${diffMinutes} min`;
            }
            return `Hoy en ${diffHours}h`;
        } else if (diffDays === 1) {
            return 'Mañana';
        } else if (diffDays <= 7) {
            return `En ${diffDays} días`;
        }
        
        return `${diffDays} días`;
    }
    
    // Actualizar estadísticas
    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        // Actualizar contadores
        if (totalTasksSpan) totalTasksSpan.textContent = total;
        if (completedTasksSpan) completedTasksSpan.textContent = completed;
        if (sidebarTotalTasks) sidebarTotalTasks.textContent = total;
        if (sidebarCompletedTasks) sidebarCompletedTasks.textContent = completed;
        
        // Actualizar barras de progreso
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
            progressBar.setAttribute('aria-valuenow', progress);
        }
        
        if (mainProgressBar) {
            mainProgressBar.style.width = `${progress}%`;
            mainProgressBar.textContent = `${progress}%`;
        }
    }
    
    // Actualizar alerta de próximas tareas
    function updateUpcomingAlert() {
        if (!upcomingAlert) return;
        
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const upcomingTasks = tasks.filter(task => {
            if (task.completed || !task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return dueDate >= now && dueDate <= tomorrow;
        });
        
        if (upcomingTasks.length > 0) {
            upcomingAlert.style.display = 'flex';
            upcomingCount.textContent = upcomingTasks.length;
        } else {
            upcomingAlert.style.display = 'none';
        }
    }
    
    // Actualizar lista de próximas tareas en sidebar
    function updateUpcomingTasksList() {
        if (!upcomingTasksList) return;
        
        const now = new Date();
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        const upcomingTasks = tasks.filter(task => {
            if (task.completed || !task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return dueDate >= now && dueDate <= nextWeek;
        }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        
        upcomingTasksList.innerHTML = '';
        
        if (upcomingTasks.length === 0) {
            upcomingTasksList.innerHTML = `
                <li class="list-group-item border-0 text-muted">
                    <i class="bi bi-info-circle me-2"></i>
                    No hay tareas próximas
                </li>
            `;
            return;
        }
        
        upcomingTasks.slice(0, 5).forEach(task => {
            const dueDate = new Date(task.dueDate);
            const formattedDate = dueDate.toLocaleDateString('es-ES', {
                weekday: 'short',
                day: '2-digit',
                month: 'short'
            });
            
            const li = document.createElement('li');
            li.className = 'list-group-item border-0';
            li.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div style="max-width: 70%;">
                        <small class="d-block text-truncate ${task.completed ? 'task-completed' : ''}">
                            ${escapeHtml(task.text || task.title)}
                        </small>
                        <small class="text-muted">${formattedDate}</small>
                    </div>
                    <span class="badge ${task.priority === 'urgente' ? 'bg-danger' : 'bg-warning'}">
                        ${getTimeLeft(dueDate)}
                    </span>
                </div>
            `;
            upcomingTasksList.appendChild(li);
        });
    }
    
    // Mostrar alerta
    function showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        const icon = type === 'success' ? 'bi-check-circle' : 
                    type === 'warning' ? 'bi-exclamation-triangle' : 
                    type === 'danger' ? 'bi-x-circle' : 'bi-info-circle';
        
        alertDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi ${icon} me-2"></i>
                <span>${message}</span>
                <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 4000);
    }
    
    // Escapar HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Resetear formulario
    function resetForm() {
        taskInput.value = '';
        prioritySelect.value = 'media';
        
        // Mañana a las 12:00 por defecto
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(12, 0, 0, 0);
        dueDateInput.value = tomorrow.toISOString().slice(0, 16);
        
        taskInput.focus();
    }
    
    // ====================
    // EVENT LISTENERS
    // ====================
    
    // Formulario de nueva tarea
    if (taskForm) {
        taskForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addTask();
        });
    }
    
    // Filtros
    if (filterButtons) {
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                currentFilter = this.dataset.filter;
                renderTasks();
            });
        });
    }
    
    // Configurar fecha por defecto
    if (dueDateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(12, 0, 0, 0);
        dueDateInput.min = new Date().toISOString().slice(0, 16);
        dueDateInput.value = tomorrow.toISOString().slice(0, 16);
    }
    
    // ====================
    // INICIALIZACIÓN
    // ====================
    console.log('🚀 TaskFlow iniciando...');
    loadTasks();
    
    // Recordatorio diario
    setTimeout(() => {
        const today = new Date();
        const todayTasks = tasks.filter(task => {
            if (task.completed || !task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return dueDate.toDateString() === today.toDateString();
        });
        
        if (todayTasks.length > 0) {
            showAlert(`📅 Tienes ${todayTasks.length} tarea(s) para hoy`, 'info');
        }
    }, 2000);
});