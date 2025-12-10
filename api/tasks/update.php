<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT');

require_once '../../config/Database.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'ID is required']);
    exit;
}

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    $sql = "UPDATE tasks SET 
            title = :title,
            description = :description,
            priority = :priority,
            due_date = :due_date,
            completed = :completed
            WHERE id = :id";
    
    $stmt = $conn->prepare($sql);
    $stmt->bindValue(':title', $input['title']);
    $stmt->bindValue(':description', $input['description'] ?? '');
    $stmt->bindValue(':priority', $input['priority'] ?? 'media');
    $stmt->bindValue(':due_date', $input['due_date'] ?? null);
    $stmt->bindValue(':completed', $input['completed'] ?? false, PDO::PARAM_BOOL);
    $stmt->bindValue(':id', $input['id'], PDO::PARAM_INT);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Error updating task']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}