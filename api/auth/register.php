<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once '../../config/database.php';
session_start();

$input = json_decode(file_get_contents('php://input'), true);
$username = trim($input['username'] ?? '');
$email = filter_var(trim($input['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$password = $input['password'] ?? '';

if (!$username || !$email || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'username, email y password son obligatorios']);
    exit;
}

try {
    $database = new Database();
    $conn = $database->getConnection();

    // Comprobar usuario existente (username o email)
    $stmt = $conn->prepare("SELECT id FROM users WHERE username = :username OR email = :email LIMIT 1");
    $stmt->bindValue(':username', $username);
    $stmt->bindValue(':email', $email);
    $stmt->execute();

    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Usuario o email ya existe']);
        exit;
    }

    // Hashear la contraseña
    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $conn->prepare("INSERT INTO users (username, email, password_hash) VALUES (:username, :email, :password_hash)");
    $stmt->bindValue(':username', $username);
    $stmt->bindValue(':email', $email);
    $stmt->bindValue(':password_hash', $password_hash);

    if ($stmt->execute()) {
        $userId = $conn->lastInsertId();
        // iniciar sesión automáticamente
        $_SESSION['user_id'] = (int)$userId;
        $_SESSION['username'] = $username;

        http_response_code(201);
        echo json_encode(['success' => true, 'user' => ['id' => $userId, 'username' => $username, 'email' => $email]]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Error al crear usuario']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}