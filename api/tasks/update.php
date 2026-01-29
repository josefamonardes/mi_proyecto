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

$title = trim((string)($in['title'] ?? ''));
if ($title === '') {
  respond(false, 'Title is required', null, 400);
}

$description = (string)($in['description'] ?? '');
$priority = (string)($in['priority'] ?? 'media');
$due_date = $in['due_date'] ?? null;
$completed = filter_var($in['completed'] ?? false, FILTER_VALIDATE_BOOL);

$allowed = ['urgente','alta','media','baja'];
if (!in_array($priority, $allowed, true)) $priority = 'media';

try {
  $database = new Database();
  $conn = $database->getConnection();

  $sql = "UPDATE tasks SET
            title = :title,
            description = :description,
            priority = :priority,
            due_date = :due_date,
            completed = :completed
          WHERE id = :id AND user_id = :user_id";
  $stmt = $conn->prepare($sql);
  $stmt->execute([
    ':title' => $title,
    ':description' => $description,
    ':priority' => $priority,
    ':due_date' => $due_date ?: null,
    ':completed' => $completed ? 1 : 0,
    ':id' => $id,
    ':user_id' => $user_id,
  ]);

  if ($stmt->rowCount() === 0) {
    respond(false, 'No existe la tarea o no tienes permisos', null, 404);
  }

  respond(true, 'Tarea actualizada');
} catch (Throwable $e) {
  respond(false, 'Error interno', null, 500);
}
