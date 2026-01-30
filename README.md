# TaskFlow (mi_proyecto) – Proyecto Full Stack

Aplicación web Full Stack para gestionar **tareas personales por usuario**.  
Incluye **registro/login/logout**, **gestión de perfil** (ver datos + cambiar contraseña) y **CRUD completo de tareas**.

---

## ✅ Funcionalidades

### Autenticación
- Registro de usuario
- Inicio de sesión / cierre de sesión
- Endpoint `whoami` para comprobar sesión activa

### Perfil
- Ver datos del usuario (username/email)
- Cambio de contraseña (con verificación de la contraseña actual)

### Tareas (CRUD)
- Crear tarea
- Listar tareas (solo del usuario autenticado)
- Actualizar tarea (incluye marcar como completada)
- Eliminar tarea

---

## 🧱 Tecnologías
- **Frontend:** HTML5, CSS3, JavaScript (Fetch API)
- **Backend:** PHP 8+, MySQL, PDO (Prepared Statements), sesiones

---

## 🔐 Seguridad aplicada
- Contraseñas con `password_hash()` + `password_verify()`
- Consultas con **Prepared Statements (PDO)** contra SQL Injection
- Endpoints protegidos por **sesión** (401 si no hay login)
- Aislamiento de datos por `user_id` (cada usuario solo ve/modifica sus tareas)

---

## 📁 Estructura del proyecto (real)

```
mi_proyecto/
├── index.html
├── auth.html
├── profile.html
├── script.js
├── profile.js
├── style.css
├── README.md
├── documentacion_proyecto.md
├── config/
│   └── database.php
├── database/
│   └── schema.sql
├── models/
│   └── task.php
└── api/
    ├── index.php
    ├── _common.php
    ├── auth/
    │   ├── check_auth.php
    │   ├── login.php
    │   ├── logout.php
    │   ├── register.php
    │   ├── whoami.php
    │   ├── profile.php
    │   └── change_password.php
    └── tasks/
        ├── create.php
        ├── read.php
        ├── update.php
        └── delete.php
```

---

## 🚀 Instalación (XAMPP recomendado)

### 1) Requisitos
- PHP 8+
- MySQL/MariaDB
- Apache (XAMPP/WAMP/MAMP)

### 2) Colocar el proyecto
Copia la carpeta `mi_proyecto/` dentro de:

- **Windows (XAMPP):** `C:\xampp\htdocs\mi_proyecto\`
- **Linux/Mac:** directorio público del servidor web equivalente

### 3) Crear la base de datos
En **phpMyAdmin** (o consola MySQL), importa:

- `database/schema.sql`

Este script crea la BD y tablas necesarias.

> **Nombre de BD por defecto:** `mi_proyecto_db`

### 4) Configurar conexión a BD
Edita el archivo:

- `config/database.php`

Valores por defecto (si usas XAMPP típico):
- host: `localhost`
- port: `3306`
- user: `root`
- pass: `""`
- db_name: `mi_proyecto_db`

### 5) Ejecutar
Abre en el navegador:

- `http://localhost/mi_proyecto/auth.html` (registro/login)
- `http://localhost/mi_proyecto/index.html` (tareas)
- `http://localhost/mi_proyecto/profile.html` (perfil)

---

## 🔌 Endpoints API (referencia)

Base: `/mi_proyecto/api/`

### Auth
- `POST api/auth/register.php`
- `POST api/auth/login.php`
- `POST api/auth/logout.php`
- `GET  api/auth/whoami.php`
- `GET  api/auth/profile.php`
- `POST api/auth/change_password.php`

### Tasks
- `GET  api/tasks/read.php`
- `POST api/tasks/create.php`
- `POST api/tasks/update.php`
- `POST api/tasks/delete.php`

> Nota: el frontend consume estos endpoints vía Fetch API desde `script.js` y `profile.js`.

---

## 🧪 Comprobación rápida
1. Registra un usuario en `auth.html`
2. Haz login
3. En `index.html` crea 2 tareas
4. Recarga y verifica que siguen
5. En `profile.html` cambia la contraseña y vuelve a iniciar sesión con la nueva

---

## 📄 Documentación adicional
- `documentacion_proyecto.md` (memoria técnica)
- `database/schema.sql` (script de base de datos)

---

## ✅ Estado
Proyecto finalizado y listo para entrega.
