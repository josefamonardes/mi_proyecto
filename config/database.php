<?php
declare(strict_types=1);

class Database {
    private string $host = "localhost";
    private string $port = "3306";
    private string $db_name = "mi_proyecto_db";
    private string $username = "root";
    private string $password = "";
    private ?PDO $conn = null;

    public function getConnection(): PDO {
        if ($this->conn instanceof PDO) return $this->conn;

        $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->db_name};charset=utf8mb4";

        try {
            $this->conn = new PDO($dsn, $this->username, $this->password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
            return $this->conn;
        } catch (PDOException $e) {
            // NO hagas die() en una API: deja que el endpoint responda JSON
            throw new RuntimeException("Error de conexión a la BD");
        }
    }
}
