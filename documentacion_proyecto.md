# Documentación del Proyecto — TaskFlow

## 1. Descripción
TaskFlow es una aplicación web full stack para hacer un registro de tareas por usuario, tener tu propio calendario y avisos por prioridad.
Incluye frontend (HTML/CSS/JS) y backend (PHP + MySQL) con API REST simple.

## 2. Tecnologías
- Frontend: HTML5, CSS3, JavaScript, Bootstrap 5
- Backend: PHP 8+ (PDO), sesiones
- Base de datos: MySQL

## 3. Funcionalidades
### 3.1 Autenticación
- Registro con contraseña hasheada (`password_hash`)
- Login con verificación (`password_verify`)
- Logout
- Endpoint `whoami` para validar sesión activa

### 3.2 Tareas
Cada usuario autenticado puede:
- Crear tarea
- Listar sus tareas
- Actualizar (título, prioridad, fecha, completado)
- Eliminar

## 4. Seguridad aplicada
- Prepared Statements (PDO) para evitar SQL Injection
- `password_hash()` / `password_verify()` para credenciales
- Sesiones para control de autenticación
- Respuesta JSON estándar para la API
- Validación en cliente (JS) para email/usuario/contraseña

## 5. Estructura del proyecto (resumen)
- `index.html`: app de tareas
- `auth.html`: login/registro
- `script.js`: lógica frontend + Fetch API
- `api/`: endpoints PHP
- `config/database.php`: conexión PDO
- `database/schema.sql`: script de creación de BD

## 6. Instalación y ejecución (XAMPP)
1. Copia la carpeta `mi_proyecto` dentro de `htdocs`.
2. Inicia Apache y MySQL desde XAMPP.
3. En phpMyAdmin, ejecuta `database/schema.sql`.
4. Abre en el navegador:
   - `http://localhost/mi_proyecto/auth.html`

## 7. Pruebas rápidas
- Registro: prueba una contraseña débil (debe bloquear en cliente) y una fuerte (debe permitir).
- Login: prueba credenciales incorrectas (debe devolver 401 con JSON).
- CRUD de tareas: crea, marca completada, actualiza y elimina.
