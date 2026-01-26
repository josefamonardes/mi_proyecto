<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once '../../config/database.php';
require_once '../auth/check_auth.php'; // define $user_id

try {
    $database = new Database();
    $conn = $database->getConnection();

    $query = "SELECT * FROM tasks WHERE user_id = :user_id
              ORDER BY 
                completed ASC,
                CASE priority 
                    WHEN 'urgente' THEN 1
                    WHEN 'alta' THEN 2
                    WHEN 'media' THEN 3
                    WHEN 'baja' THEN 4
                END ASC,
                due_date ASC";

    $stmt = $conn->prepare($query);
    $stmt->bindValue(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();

    $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['tasks' => $tasks]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}