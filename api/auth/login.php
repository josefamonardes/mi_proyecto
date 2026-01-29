<?php
declare(strict_types=1);

require_once __DIR__ . '/../_common.php';
require_once __DIR__ . '/../../config/database.php';

$in = input();
$identifier = trim((string)($in['identifier'] ?? '')); // username o email
$password = (string)($in['password'] ?? '');

if ($identifier === '' || $password === '') {
  respond(false, 'identifier y password son obligatorios', null, 400);
}

try {
  $database = new Database();
  $conn = $database->getConnection();

  $stmt = $conn->prepare(
    "SELECT id, username, email, password_hash
     FROM users
     WHERE username = :id OR email = :id
     LIMIT 1"
  );
  $stmt->execute([':id' => $identifier]);
  $user = $stmt->fetch();

  if (!$user || !password_verify($password, (string)$user['password_hash'])) {
    respond(false, 'Credenciales inválidas', null, 401);
  }

  session_regenerate_id(true);
  $_SESSION['user_id'] = (int)$user['id'];
  $_SESSION['username'] = (string)$user['username'];

  respond(true, 'Login correcto', [
    'user' => [
      'id' => (int)$user['id'],
      'username' => (string)$user['username'],
      'email' => (string)$user['email'],
    ],
  ]);
} catch (Throwable $e) {
  respond(false, 'Error interno', null, 500);
}
