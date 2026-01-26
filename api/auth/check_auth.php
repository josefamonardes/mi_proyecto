<?php
// Usar como include en endpoints que requieran autenticación
session_start();
if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'No autenticado']);
    exit;
}
$user_id = (int)$_SESSION['user_id'];