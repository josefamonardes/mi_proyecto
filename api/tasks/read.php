<?php
// api/tasks/read.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// RUTA CORREGIDA: __DIR__ obtiene la ruta absoluta
require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../models/Task.php';

// Para debug
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    $task = new Task();
    $stmt = $task->readAll();
    
    $tasks_arr = array();
    $tasks_arr["data"] = array();
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        extract($row);
        
        $task_item = array(
            "id" => $id,
            "title" => $title,
            "description" => $description,
            "priority" => $priority,
            "due_date" => $due_date,
            "completed" => (bool)$completed,
            "created_at" => $created_at,
            "updated_at" => $updated_at
        );
        
        array_push($tasks_arr["data"], $task_item);
    }
    
    echo json_encode($tasks_arr);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "error" => $e->getMessage(),
        "trace" => $e->getTraceAsString()
    ));
}