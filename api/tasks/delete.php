<?php
declare(strict_types=1);

require_once __DIR__ . '/../_common.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../auth/check_auth.php'; // $user_id

$in = input();
$id = isset($in['id']) ? (int)$in['id'] : 0;
if ($id <= 0) {
  respond(false, 'ID is required', null, 400);
}

try {
  $database = new Database();
  $conn = $database->getConnection();

  $stmt = $conn->prepare("DELETE FROM tasks WHERE id = :id AND user_id = :user_id");
  $stmt->execute([':id' => $id, ':user_id' => $user_id]);

  if ($stmt->rowCount() === 0) {
    respond(false, 'No existe la tarea o no tienes permisos', null, 404);
  }

  respond(true, 'Tarea eliminada');
} catch (Throwable $e) {
  respond(false, 'Error interno', null, 500);
}
