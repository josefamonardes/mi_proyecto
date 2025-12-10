-- Este archivo crea la base de datos completa para TaskFlow

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS taskflow_db;
USE taskflow_db;

-- Tabla de usuarios (para futuras implementaciones de login)
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla principal de tareas
CREATE TABLE IF NOT EXISTS tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT DEFAULT 1, -- Por ahora usaremos user_id = 1 para desarrollo
    title VARCHAR(500) NOT NULL,
    description TEXT,
    priority ENUM('baja', 'media', 'alta', 'urgente') DEFAULT 'media',
    due_date DATETIME NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_completed (completed),
    INDEX idx_due_date (due_date),
    INDEX idx_priority (priority)
);

-- Insertar datos de ejemplo para pruebas
INSERT INTO tasks (title, priority, due_date, completed) VALUES
('Completar informe de proyecto', 'alta', DATE_ADD(NOW(), INTERVAL 2 DAY), FALSE),
('Revisar correos electrónicos', 'media', DATE_ADD(NOW(), INTERVAL 1 DAY), TRUE),
('Preparar presentación para reunión', 'urgente', DATE_ADD(NOW(), INTERVAL 5 HOUR), FALSE),
('Hacer la compra semanal', 'baja', DATE_ADD(NOW(), INTERVAL 3 DAY), FALSE),
('Llamar al cliente importante', 'alta', DATE_ADD(NOW(), INTERVAL 1 HOUR), FALSE),
('Actualizar documentación del proyecto', 'media', NULL, FALSE);

-- Mostrar las tablas creadas
SHOW TABLES;

-- Mostrar estructura de la tabla tasks
DESCRIBE tasks;

-- Mostrar datos de ejemplo
SELECT * FROM tasks;