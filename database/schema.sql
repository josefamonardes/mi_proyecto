-- ==============================
-- Base de datos: mi_proyecto_db
-- ==============================

CREATE DATABASE IF NOT EXISTS mi_proyecto_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mi_proyecto_db;

-- ==============================
-- Tabla de usuarios
-- ==============================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- almacenar con password_hash()
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================
-- Tabla principal de tareas
-- Cada tarea pertenece a un usuario
-- ==============================
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    priority ENUM('urgente','alta','media','baja') NOT NULL DEFAULT 'media',
    due_date DATETIME NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_completed (completed),
    INDEX idx_due_date (due_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================
-- Datos de ejemplo (opcional)
-- ==============================
-- NOTA: para insertar un usuario con contraseña, genera el hash con PHP:
-- php -r "echo password_hash('TU_PASS', PASSWORD_DEFAULT) . PHP_EOL;"
-- y pega el hash en el INSERT siguiente si quieres un usuario de prueba.

-- INSERT INTO users (username, email, password_hash) VALUES
-- ('dev', 'dev@example.com', '$2y$10$...reemplaza-con-tu-hash...');

-- INSERT INTO tasks (user_id, title, description, priority, due_date, completed) VALUES
-- (1, 'Tarea ejemplo: revisar repo', 'Revisar esquema y endpoints', 'alta', DATE_ADD(NOW(), INTERVAL 2 DAY), FALSE);