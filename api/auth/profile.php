<?php
declare(strict_types=1);

require_once __DIR__ . '/../_common.php';
require_once __DIR__ . '/../../config/database.php';

$user_id = require_auth();

try {
  $database = new Database();
  $conn = $database->getConnection();

  $stmt = $conn->prepare(
    'SELECT id, username, email, created_at FROM users WHERE id = :id LIMIT 1'
  );
  $stmt->execute([':id' => $user_id]);
  $user = $stmt->fetch();

  if (!$user) {
    respond(false, 'Usuario no encontrado', null, 404);
  }

  respond(true, 'OK', [
    'id' => (int)$user['id'],
    'username' => (string)$user['username'],
    'email' => (string)$user['email'],
    'created_at' => (string)($user['created_at'] ?? ''),
  ]);
} catch (Throwable $e) {
  respond(false, 'Error interno', null, 500);
}
