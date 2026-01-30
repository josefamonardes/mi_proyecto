<?php
declare(strict_types=1);

/*
| Sesión (centralizada)
*/
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

/*
| Respuesta JSON estándar
*/
function respond(bool $ok, string $message = '', array|null $data = null, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');

    // Mantén siempre la clave "data" para no romper el frontend
    if ($data === null) {
        $data = [];
    }

    echo json_encode([
        'ok'      => $ok,
        'message' => $message,
        'data'    => $data
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

/*
| Validaciones comunes
*/
function is_valid_username(string $username): bool
{
    // 3-20 caracteres, letras/números y . _ -
    $len = strlen($username);
    if ($len < 3 || $len > 20) return false;
    return (bool) preg_match('/^[a-zA-Z0-9._-]+$/', $username);
}

function is_strong_password(string $password): bool
{
    // Mínimo 8, al menos una minúscula, una mayúscula y un número
    if (strlen($password) < 8) return false;
    if (!preg_match('/[a-z]/', $password)) return false;
    if (!preg_match('/[A-Z]/', $password)) return false;
    if (!preg_match('/[0-9]/', $password)) return false;
    return true;
}

/*
| Lectura de input (JSON o POST)
*/
function input(): array
{
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    if (str_contains($contentType, 'application/json')) {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);

        return is_array($data) ? $data : [];
    }

    return $_POST ?? [];
}

/*
| Requiere autenticación
*/
function require_auth(): int
{
    if (empty($_SESSION['user_id'])) {
        respond(false, 'No autenticado', [], 401);
    }

    return (int) $_SESSION['user_id'];
}
