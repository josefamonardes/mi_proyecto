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
function respond(bool $ok, string $message = '', array $data = [], int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');

    echo json_encode([
        'ok'      => $ok,
        'message' => $message,
        'data'    => $data
    ]);

    exit;
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
