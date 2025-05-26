<?php
require_once 'config.php';

function handleArticles($method) {
    global $pdo;
    
    if ($method === 'GET') {
        $category = $_GET['category'] ?? null;
        $search = $_GET['search'] ?? null;
        
        $where = [];
        $params = [];
        
        if ($category) {
            $where[] = "category = :category";
            $params[':category'] = $category;
        }
        
        if ($search) {
            $where[] = "(title ILIKE :search OR excerpt ILIKE :search)";
            $params[':search'] = "%$search%";
        }
        
        $whereClause = $where ? "WHERE " . implode(" AND ", $where) : "";
        
        $stmt = $pdo->prepare("
            SELECT *
            FROM articles
            $whereClause
            ORDER BY published_at DESC
        ");
        
        $stmt->execute($params);
        echo json_encode([
            'success' => true,
            'articles' => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ]);
    }
}

handleArticles($_SERVER['REQUEST_METHOD']);