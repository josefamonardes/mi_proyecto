// Funcionalidad básica para la lista de tareas
document.addEventListener('DOMContentLoaded', function() {
    // Formulario para añadir tareas
    const taskForm = document.getElementById('taskForm');
    const taskInput = document.getElementById('taskInput');
    const prioritySelect = document.getElementById('prioritySelect');
    const taskList = document.getElementById('taskList');
    
    // Manejar envío del formulario
    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const taskText = taskInput.value.trim();
        const priority = prioritySelect.value;
        
        if (taskText) {
            addTask(taskText, priority);
            taskInput.value = '';
            taskInput.focus();
            
            // Mostrar notificación
            showNotification('Tarea añadida correctamente', 'success');
        }
    });
    
    // Función para añadir tarea
    function addTask(text, priority) {
        const taskId = 'task-' + Date.now();
        
        // Crear elemento de tarea
        const taskElement = document.createElement('div');
        taskElement.className = 'list-group-item list-group-item-action border-0 mb-2 shadow-sm';
        taskElement.innerHTML = `
            <div class="d-flex w-100 justify-content-between align-items-center">
                <div class="form-check">
                    <input class="form-check-input task-checkbox" type="checkbox" id="${taskId}">
                    <label class="form-check-label ms-2" for="${taskId}">
                        <span class="task-title">${text}</span>
                        ${getPriorityBadge(priority)}
                    </label>
                </div>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary edit-btn">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-btn">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
            <small class="text-muted">
                <i class="bi bi-calendar"></i> Añadido ahora
            </small>
        `;
        
        taskList.prepend(taskElement);
        
        // Añadir eventos a los botones
        addTaskEvents(taskElement);
    }
    
    // Función para obtener badge de prioridad
    function getPriorityBadge(priority) {
        const badges = {
            'baja': 'bg-secondary',
            'media': 'bg-success',
            'alta': 'bg-warning',
            'urgente': 'bg-danger'
        };
        
        const priorityText = {
            'baja': 'Baja',
            'media': 'Media',
            'alta': 'Alta',
            'urgente': 'Urgente'
        };
        
        return `<span class="badge ${badges[priority]} ms-2">${priorityText[priority]}</span>`;
    }
    
    // Función para añadir eventos a las tareas
    function addTaskEvents(taskElement) {
        const checkbox = taskElement.querySelector('.task-checkbox');
        const editBtn = taskElement.querySelector('.edit-btn');
        const deleteBtn = taskElement.querySelector('.delete-btn');
        
        // Marcar como completada
        checkbox.addEventListener('change', function() {
            const taskTitle = taskElement.querySelector('.task-title');
            if (this.checked) {
                taskTitle.classList.add('completed');
            } else {
                taskTitle.classList.remove('completed');
            }
        });
        
        // Editar tarea
        editBtn.addEventListener('click', function() {
            const taskTitle = taskElement.querySelector('.task-title');
            const newText = prompt('Editar tarea:', taskTitle.textContent);
            if (newText && newText.trim()) {
                taskTitle.textContent = newText.trim();
                showNotification('Tarea actualizada', 'info');
            }
        });
        
        // Eliminar tarea
        deleteBtn.addEventListener('click', function() {
            if (confirm('¿Eliminar esta tarea?')) {
                taskElement.remove();
                showNotification('Tarea eliminada', 'warning');
            }
        });
    }
    
    // Función para mostrar notificaciones
    function showNotification(message, type) {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Añadir al cuerpo
        document.body.appendChild(notification);
        
        // Eliminar automáticamente después de 3 segundos
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Inicializar eventos para tareas existentes
    document.querySelectorAll('.list-group-item').forEach(task => {
        addTaskEvents(task);
    });
    
    // Filtros de tareas
    document.querySelectorAll('.btn-group .btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remover clase active de todos los botones
            document.querySelectorAll('.btn-group .btn').forEach(b => {
                b.classList.remove('active');
            });
            
            // Añadir clase active al botón clickeado
            this.classList.add('active');
            
            const filterType = this.textContent.toLowerCase();
            filterTasks(filterType);
        });
    });
    
    // Función para filtrar tareas
    function filterTasks(filter) {
        document.querySelectorAll('.list-group-item').forEach(task => {
            const isCompleted = task.querySelector('.task-checkbox').checked;
            
            switch(filter) {
                case 'todas':
                    task.style.display = 'block';
                    break;
                case 'pendientes':
                    task.style.display = isCompleted ? 'none' : 'block';
                    break;
                case 'completadas':
                    task.style.display = isCompleted ? 'block' : 'none';
                    break;
            }
        });
    }
});