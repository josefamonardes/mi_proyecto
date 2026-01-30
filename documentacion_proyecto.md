# Documentación del Proyecto – TaskFlow
## Proyecto Full Stack – Ingeniería Web

---

## 1. Introducción

El presente documento describe el desarrollo del proyecto **TaskFlow**, una aplicación web Full Stack orientada a la **gestión de tareas personales por usuario**.

El objetivo principal del proyecto es aplicar de forma práctica los contenidos vistos en la asignatura de **Ingeniería Web**, cubriendo tanto el desarrollo frontend como backend, con especial atención a la **seguridad**, la **arquitectura del sistema** y la **persistencia de datos**.

---

## 2. Objetivos del proyecto

### Objetivo general
Desarrollar una aplicación web segura que permita a los usuarios gestionar sus tareas personales mediante un sistema de autenticación.

### Objetivos específicos
- Implementar un sistema de registro e inicio de sesión seguro.
- Permitir la gestión completa de tareas (CRUD).
- Garantizar que cada usuario solo pueda acceder a sus propios datos.
- Aplicar buenas prácticas de seguridad en el backend.
- Implementar comunicación asíncrona entre frontend y backend.
- Desarrollar una gestión básica de perfil de usuario.

---

## 3. Arquitectura del sistema

La aplicación sigue una arquitectura **cliente-servidor** con separación clara de responsabilidades:

- **Frontend**: HTML, CSS y JavaScript.
- **Backend**: PHP con endpoints organizados por funcionalidad.
- **Base de datos**: MySQL para persistencia.

### Flujo general de funcionamiento
1. El usuario interactúa con la interfaz web.
2. El frontend envía peticiones HTTP mediante Fetch API.
3. El backend procesa la petición, valida datos y consulta la base de datos.
4. Se devuelve una respuesta en formato JSON.
5. El frontend actualiza la interfaz sin recargar la página.

---

## 4. Modelo de datos

La base de datos se compone de dos tablas principales:

### Tabla `users`
- `id` (PK)
- `username`
- `email`
- `password_hash`
- `created_at`

### Tabla `tasks`
- `id` (PK)
- `user_id` (FK → users.id)
- `title`
- `priority`
- `due_date`
- `completed`
- `created_at`

La relación entre usuarios y tareas es **uno a muchos**, ya que un usuario puede tener múltiples tareas.

---

## 5. Backend

El backend está desarrollado en PHP y se organiza en una API estructurada.

### Procesamiento de formularios
Los datos enviados desde el frontend se reciben mediante `$_POST` y se validan antes de ser procesados.

### Conexión a base de datos
Se utiliza **PDO** para la conexión con MySQL, lo que permite:
- Uso de prepared statements.
- Mayor seguridad frente a inyección SQL.
- Manejo de excepciones.

### Endpoints
Los endpoints se agrupan en:
- `api/auth/` → autenticación y perfil.
- `api/tasks/` → gestión de tareas.

---

## 6. Seguridad

La seguridad es un aspecto clave del proyecto.

### Medidas implementadas
- **Hash de contraseñas** con `password_hash()`.
- **Verificación segura** con `password_verify()`.
- **Prepared Statements** para todas las consultas SQL.
- **Sesiones PHP** para control de autenticación.
- **Control de acceso**: los endpoints verifican que el usuario esté autenticado.
- **Aislamiento de datos** mediante `user_id`.

Estas medidas previenen ataques comunes como SQL Injection o acceso no autorizado.

---

## 7. Frontend

### HTML
Se utiliza HTML5 con estructura semántica para mejorar la accesibilidad y organización del contenido.

### CSS
El diseño se realiza con CSS3, manteniendo una interfaz consistente y responsiva.

### JavaScript
JavaScript se emplea para:
- Validaciones en el lado del cliente.
- Envío de peticiones asíncronas.
- Actualización dinámica de la interfaz.

---

## 8. Interacción avanzada

La comunicación entre frontend y backend se realiza mediante **Fetch API**, permitiendo:
- Operaciones CRUD sin recargar la página.
- Mejor experiencia de usuario.
- Separación entre lógica de presentación y lógica de negocio.

---

## 9. Gestión de perfiles de usuario

El sistema permite:
- Visualizar los datos del usuario autenticado.
- Cambiar la contraseña tras validar la contraseña actual.

Estas operaciones están protegidas por sesión y validación backend.

---

## 10. Dificultades y aprendizaje

Durante el desarrollo se afrontaron retos relacionados con:
- Gestión de sesiones.
- Seguridad en la autenticación.
- Sincronización frontend-backend.

El proyecto permitió afianzar conocimientos de desarrollo Full Stack y buenas prácticas de programación web.

---
