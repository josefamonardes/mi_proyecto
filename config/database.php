<?php
class Database {
    private $host = "localhost";
    private $port = "3306";  
    private $db_name = "mi_proyecto_db";
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . 
                ";port=" . $this->port . 
                ";dbname=" . $this->db_name . 
                ";charset=utf8mb4",
                $this->username, 
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
        } catch(PDOException $exception) {
            die("❌ Error conexión: " . $exception->getMessage());
        }
        
        return $this->conn;
    }
}