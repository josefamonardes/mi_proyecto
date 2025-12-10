<?php
// test.php - Para probar que PHP funciona
echo "<!DOCTYPE html>";
echo "<html><head><title>Test PHP</title>";
echo "<link href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css' rel='stylesheet'>";
echo "</head><body class='container mt-5'>";
echo "<h1 class='mb-4'>🧪 Test de PHP y MySQL</h1>";

// Probar que PHP funciona
echo "<div class='card mb-3'>";
echo "<div class='card-header'>PHP Info</div>";
echo "<div class='card-body'>";
echo "<p>✅ PHP está funcionando: versión " . phpversion() . "</p>";
echo "</div></div>";

// Probar conexión a MySQL
echo "<div class='card'>";
echo "<div class='card-header'>Conexión MySQL</div>";
echo "<div class='card-body'>";

try {
    $host = "localhost";
    $username = "root";
    $password = "";
    $dbname = "taskflow_db";
    
    $conn = new mysqli($host, $username, $password);
    
    if ($conn->connect_error) {
        echo "<p class='text-danger'>❌ Error de conexión: " . $conn->connect_error . "</p>";
    } else {
        echo "<p class='text-success'>✅ Conexión a MySQL exitosa</p>";
        
        // Verificar si la base de datos existe
        if ($conn->select_db($dbname)) {
            echo "<p class='text-success'>✅ Base de datos '{$dbname}' encontrada</p>";
            
            // Contar tareas
            $result = $conn->query("SELECT COUNT(*) as count FROM tasks");
            if ($result) {
                $row = $result->fetch_assoc();
                echo "<p>📊 Tareas en la BD: <strong>" . $row['count'] . "</strong></p>";
                
                // Mostrar algunas tareas
                $result = $conn->query("SELECT title, priority, completed FROM tasks LIMIT 5");
                echo "<h5>Ejemplo de tareas:</h5><ul class='list-group'>";
                while ($row = $result->fetch_assoc()) {
                    $status = $row['completed'] ? '✅ Completada' : '⏳ Pendiente';
                    $badge_color = [
                        'baja' => 'secondary',
                        'media' => 'success', 
                        'alta' => 'warning',
                        'urgente' => 'danger'
                    ][$row['priority']];
                    
                    echo "<li class='list-group-item d-flex justify-content-between align-items-center'>";
                    echo "<span>{$row['title']}</span>";
                    echo "<span>";
                    echo "<span class='badge bg-{$badge_color} me-2'>{$row['priority']}</span>";
                    echo "<small>{$status}</small>";
                    echo "</span></li>";
                }
                echo "</ul>";
            }
        } else {
            echo "<p class='text-warning'>⚠️ La base de datos '{$dbname}' no existe</p>";
            echo "<a href='#crear-bd' class='btn btn-sm btn-primary' data-bs-toggle='collapse'>Crear Base de Datos</a>";
            echo "<div id='crear-bd' class='collapse mt-3'>";
            echo "<p>Ejecuta este SQL en phpMyAdmin:</p>";
            echo "<pre class='bg-light p-3'><code>";
            echo file_get_contents('database/taskflow_db.sql');
            echo "</code></pre>";
            echo "</div>";
        }
        
        $conn->close();
    }
} catch (Exception $e) {
    echo "<p class='text-danger'>❌ Error: " . $e->getMessage() . "</p>";
}

echo "</div></div>";

// Botones de navegación
echo "<div class='mt-4'>";
echo "<a href='/' class='btn btn-primary'>← Volver al Home</a> ";
echo "<a href='http://localhost/phpmyadmin' target='_blank' class='btn btn-secondary'>Abrir phpMyAdmin</a>";
echo "</div>";

echo "</body></html>";