<?php
declare(strict_types=1);

require_once __DIR__ . '/../_common.php';
require_once __DIR__ . '/../../config/database.php';

$in = input();
$username = trim((string)($in['username'] ?? ''));
$emailRaw = trim((string)($in['email'] ?? ''));
$email = filter_var($emailRaw, FILTER_VALIDATE_EMAIL) ?: '';
$password = (string)($in['password'] ?? '');

if ($username === '' || $email === '' || $password === '') {
  respond(false, 'username, email y password son obligatorios', null, 400);
}
if (!is_valid_username($username)) {
  respond(false, 'Username inválido (3-20, letras/números/_)', null, 400);
}
if (!is_strong_password($password)) {
  respond(false, 'Contraseña débil (8+, mayúscula, minúscula y número)', null, 400);
}

try {
  $database = new Database();
  $conn = $database->getConnection();

  // existe username o email
  $stmt = $conn->prepare("SELECT id FROM users WHERE username = :u OR email = :e LIMIT 1");
  $stmt->execute([':u' => $username, ':e' => $email]);
  if ($stmt->fetch()) {
    respond(false, 'Usuario o email ya existe', null, 409);
  }

  $hash = password_hash($password, PASSWORD_DEFAULT);

  $stmt = $conn->prepare("INSERT INTO users (username, email, password_hash) VALUES (:u, :e, :h)");
  $stmt->execute([':u' => $username, ':e' => $email, ':h' => $hash]);

  $userId = (int)$conn->lastInsertId();

  session_regenerate_id(true);
  $_SESSION['user_id'] = $userId;
  $_SESSION['username'] = $username;

  respond(true, 'Usuario creado', [
    'user' => ['id' => $userId, 'username' => $username, 'email' => $email]
  ], 201);

} catch (Throwable $e) {
  respond(false, 'Error interno', null, 500);
}
