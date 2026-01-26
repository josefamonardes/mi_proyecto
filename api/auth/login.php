<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once '../../config/database.php';
session_start();

$input = json_decode(file_get_contents('php://input'), true);
$identifier = trim($input['identifier'] ?? ''); // puede ser username o email
$password = $input['password'] ?? '';

if (!$identifier || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'identifier y password son obligatorios']);
    exit;
}

try {
    $database = new Database();
    $conn = $database->getConnection();

    $stmt = $conn->prepare("SELECT id, username, email, password_hash FROM users WHERE username = :id OR email = :id LIMIT 1");
    $stmt->bindValue(':id', $identifier);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Credenciales inválidas']);
        exit;
    }

    // Login OK -> inicializar sesión
    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['username'] = $user['username'];

    echo json_encode(['success' => true, 'user' => ['id' => (int)$user['id'], 'username' => $user['username'], 'email' => $user['email']]]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}