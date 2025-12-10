<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE');

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
    
    $sql = "DELETE FROM tasks WHERE id = :id";
    $stmt = $conn->prepare($sql);
    $stmt->bindValue(':id', $input['id'], PDO::PARAM_INT);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Error deleting task']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}