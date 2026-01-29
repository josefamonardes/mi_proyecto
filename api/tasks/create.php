<?php
declare(strict_types=1);

require_once __DIR__ . '/../_common.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../auth/check_auth.php'; // define $user_id

$in = input();

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

  $sql = "INSERT INTO tasks (user_id, title, description, priority, due_date, completed)
          VALUES (:user_id, :title, :description, :priority, :due_date, :completed)";
  $stmt = $conn->prepare($sql);
  $stmt->execute([
    ':user_id' => $user_id,
    ':title' => $title,
    ':description' => $description,
    ':priority' => $priority,
    ':due_date' => $due_date ?: null,
    ':completed' => $completed ? 1 : 0,
  ]);

  $taskId = (int)$conn->lastInsertId();
  $stmt = $conn->prepare("SELECT * FROM tasks WHERE id = :id AND user_id = :uid");
  $stmt->execute([':id' => $taskId, ':uid' => $user_id]);
  $task = $stmt->fetch();

  respond(true, 'Tarea creada', ['task' => $task]);
} catch (Throwable $e) {
  respond(false, 'Error interno', null, 500);
}
