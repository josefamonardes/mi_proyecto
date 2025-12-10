<?php
// models/Task.php
require_once __DIR__ . '/../config/Database.php';

class Task {
    private $conn;
    private $table = "tasks";

    public $id;
    public $title;
    public $description;
    public $priority = 'media';
    public $due_date = null;
    public $completed = false;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    // Crear tarea
    public function create() {
        $query = "INSERT INTO " . $this->table . " 
                  (title, description, priority, due_date, completed) 
                  VALUES (:title, :description, :priority, :due_date, :completed)";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":priority", $this->priority);
        $stmt->bindParam(":due_date", $this->due_date);
        $stmt->bindParam(":completed", $this->completed);
        
        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    // Leer todas las tareas
    public function readAll() {
        $query = "SELECT * FROM " . $this->table . " 
                  ORDER BY 
                    completed ASC,
                    CASE priority 
                        WHEN 'urgente' THEN 1
                        WHEN 'alta' THEN 2
                        WHEN 'media' THEN 3
                        WHEN 'baja' THEN 4
                    END ASC,
                    due_date ASC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt;
    }

    // Actualizar tarea
    public function update() {
        $query = "UPDATE " . $this->table . "
                  SET title = :title,
                      description = :description,
                      priority = :priority,
                      due_date = :due_date,
                      completed = :completed
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":priority", $this->priority);
        $stmt->bindParam(":due_date", $this->due_date);
        $stmt->bindParam(":completed", $this->completed);
        $stmt->bindParam(":id", $this->id);
        
        return $stmt->execute();
    }

    // Eliminar tarea
    public function delete($id) {
        $query = "DELETE FROM " . $this->table . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        return $stmt->execute();
    }
}