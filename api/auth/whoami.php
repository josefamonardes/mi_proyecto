<?php
declare(strict_types=1);

require_once __DIR__ . '/../_common.php';

$userId = require_auth();

respond(true, 'OK', [
  'user' => [
    'id' => $userId,
    'username' => (string)($_SESSION['username'] ?? ''),
  ]
]);
