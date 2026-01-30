<?php
declare(strict_types=1);

require_once __DIR__ . '/../_common.php';
require_once __DIR__ . '/../../config/database.php';

$user_id = require_auth();

$in = input();
$current = (string)($in['current_password'] ?? '');
$new = (string)($in['new_password'] ?? '');

if ($current === '' || $new === '') {
  respond(false, 'Campos obligatorios', null, 400);
}

if (!is_strong_password($new)) {
  respond(false, 'La nueva contraseña no es segura', null, 400);
}

try {
  $database = new Database();
  $conn = $database->getConnection();

  $stmt = $conn->prepare('SELECT password_hash FROM users WHERE id = :id LIMIT 1');
  $stmt->execute([':id' => $user_id]);
  $row = $stmt->fetch();

  if (!$row || !password_verify($current, (string)$row['password_hash'])) {
    respond(false, 'Contraseña actual incorrecta', null, 401);
  }

  $newHash = password_hash($new, PASSWORD_DEFAULT);
  $upd = $conn->prepare('UPDATE users SET password_hash = :ph WHERE id = :id');
  $upd->execute([':ph' => $newHash, ':id' => $user_id]);

  respond(true, 'Contraseña actualizada', []);
} catch (Throwable $e) {
  respond(false, 'Error interno', null, 500);
}
