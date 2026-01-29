<?php
declare(strict_types=1);

require_once __DIR__ . '/../_common.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../auth/check_auth.php';

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
  $stmt->execute([':user_id' => $user_id]);

  $tasks = $stmt->fetchAll();
  respond(true, 'OK', ['tasks' => $tasks]);
} catch (Throwable $e) {
  respond(false, 'Error interno', null, 500);
}
