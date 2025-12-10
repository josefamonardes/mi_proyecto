<?php
// api/index.php
header('Content-Type: application/json');
echo json_encode([
    'message' => 'TaskFlow API v1.0',
    'endpoints' => [
        'GET /api/tasks/read.php' => 'Obtener todas las tareas',
        'POST /api/tasks/create.php' => 'Crear nueva tarea',
        'PUT /api/tasks/update.php' => 'Actualizar tarea',
        'DELETE /api/tasks/delete.php' => 'Eliminar tarea'
    ],
    'status' => 'operational'
]);