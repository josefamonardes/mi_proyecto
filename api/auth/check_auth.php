<?php
declare(strict_types=1);

require_once __DIR__ . '/../_common.php';

$isAuth = !empty($_SESSION['user_id']);
respond(true, 'OK', ['authenticated' => $isAuth]);
