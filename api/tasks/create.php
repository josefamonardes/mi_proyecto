<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once '../../config/database.php';
require_once '../auth/check_auth.php'; // inicializa sesión y define $user_id

$input = json_decode(file_get_contents('php://input'), true);

if (empty($input['title'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Title is required']);
    exit;
}

try {
    $database = new Database();
    $conn = $database->getConnection();

    $sql = "INSERT INTO tasks (user_id, title, description, priority, due_date, completed) 
            VALUES (:user_id, :title, :description, :priority, :due_date, :completed)";

    $stmt = $conn->prepare($sql);
    $stmt->bindValue(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->bindValue(':title', $input['title']);
    $stmt->bindValue(':description', $input['description'] ?? '');
    $stmt->bindValue(':priority', $input['priority'] ?? 'media');
    $stmt->bindValue(':due_date', $input['due_date'] ?? null);
    $stmt->bindValue(':completed', $input['completed'] ?? false, PDO::PARAM_BOOL);

    if ($stmt->execute()) {
        $taskId = $conn->lastInsertId();
        $stmt = $conn->prepare("SELECT * FROM tasks WHERE id = ?");
        $stmt->execute([$taskId]);
        $task = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'task' => $task
        ]);
    } else {
        echo json_encode(['error' => 'Error creating task']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}