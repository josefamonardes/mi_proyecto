<?php
// test_task.php
echo "<h2>🧪 Test de Conexión MySQL</h2>";

// Mostrar información de PHP
echo "<h3>Información del servidor:</h3>";
echo "PHP Version: " . phpversion() . "<br>";
echo "Working Directory: " . __DIR__ . "<br>";

// Probar si el archivo Database.php existe
$db_file = __DIR__ . '/config/Database.php';
if (file_exists($db_file)) {
    echo "✅ Database.php encontrado en: " . realpath($db_file) . "<br>";
} else {
    echo "❌ Database.php NO encontrado<br>";
    echo "Buscado en: " . $db_file . "<br>";
    exit;
}

// Cargar y probar Database
require_once 'config/Database.php';

$database = new Database();
$conn = $database->getConnection();

if ($conn) {
    echo "<h3 style='color: green;'>✅ Conexión a MySQL establecida</h3>";
    
    // Probar consulta
    try {
        $query = "SHOW TABLES";
        $stmt = $conn->query($query);
        
        echo "<h4>Tablas en la base de datos:</h4>";
        echo "<ul>";
        while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
            echo "<li>" . $row[0] . "</li>";
        }
        echo "</ul>";
        
        // Contar tareas
        $query = "SELECT COUNT(*) as count FROM tasks";
        $stmt = $conn->query($query);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo "📊 Total de tareas: <strong>" . $result['count'] . "</strong><br>";
        
        if ($result['count'] > 0) {
            $query = "SELECT * FROM tasks LIMIT 5";
            $stmt = $conn->query($query);
            
            echo "<h4>Primeras 5 tareas:</h4>";
            echo "<table border='1' cellpadding='5'>";
            echo "<tr><th>ID</th><th>Título</th><th>Prioridad</th><th>Completada</th></tr>";
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                echo "<tr>";
                echo "<td>" . $row['id'] . "</td>";
                echo "<td>" . htmlspecialchars($row['title']) . "</td>";
                echo "<td>" . $row['priority'] . "</td>";
                echo "<td>" . ($row['completed'] ? '✅' : '❌') . "</td>";
                echo "</tr>";
            }
            echo "</table>";
        }
        
    } catch (PDOException $e) {
        echo "❌ Error en consulta: " . $e->getMessage() . "<br>";
    }
    
} else {
    echo "<h3 style='color: red;'>❌ No se pudo conectar a MySQL</h3>";
    
    // Probar conexión sin base de datos específica
    echo "<h4>Probando conexión básica a MySQL:</h4>";
    try {
        $test_conn = new PDO("mysql:host=localhost", "root", "");
        echo "✅ Conexión básica a MySQL funciona<br>";
        
        // Verificar si la base de datos existe
        $stmt = $test_conn->query("SHOW DATABASES LIKE 'taskflow_db'");
        if ($stmt->rowCount() > 0) {
            echo "✅ Base de datos 'taskflow_db' existe<br>";
        } else {
            echo "❌ Base de datos 'taskflow_db' NO existe<br>";
            echo "<a href='http://localhost/phpmyadmin' target='_blank'>Abrir phpMyAdmin para crearla</a>";
        }
        
    } catch (PDOException $e) {
        echo "❌ Error: " . $e->getMessage() . "<br>";
    }
}

echo "<hr>";
echo "<h3>Solución de problemas:</h3>";
echo "1. Abre XAMPP Control Panel<br>";
echo "2. Asegúrate que MySQL esté en RUNNING<br>";
echo "3. Abre phpMyAdmin: <a href='http://localhost/phpmyadmin' target='_blank'>http://localhost/phpmyadmin</a><br>";
echo "4. Verifica qué usuario/contraseña usas para entrar<br>";
?>