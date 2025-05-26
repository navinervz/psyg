<?php
require_once 'config.php';

function handleOrders($method) {
    global $pdo;
    
    switch ($method) {
        case 'GET':
            $user_id = $_GET['user_id'] ?? null;
            if (!$user_id) {
                http_response_code(400);
                echo json_encode(['error' => 'User ID required']);
                return;
            }
            
            $stmt = $pdo->prepare("
                SELECT * FROM orders
                WHERE user_id = :user_id
                ORDER BY created_at DESC
            ");
            
            $stmt->execute([':user_id' => $user_id]);
            echo json_encode([
                'success' => true,
                'orders' => $stmt->fetchAll(PDO::FETCH_ASSOC)
            ]);
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("
                INSERT INTO orders (user_id, product_id, option_name, quantity, total_price)
                VALUES (:user_id, :product_id, :option_name, :quantity, :total_price)
                RETURNING id
            ");
            
            try {
                $stmt->execute([
                    ':user_id' => $data['user_id'],
                    ':product_id' => $data['product_id'],
                    ':option_name' => $data['option_name'],
                    ':quantity' => $data['quantity'],
                    ':total_price' => $data['total_price']
                ]);
                
                echo json_encode([
                    'success' => true,
                    'order_id' => $stmt->fetch(PDO::FETCH_ASSOC)['id']
                ]);
            } catch (PDOException $e) {
                http_response_code(400);
                echo json_encode(['error' => 'Failed to create order']);
            }
            break;
    }
}

handleOrders($_SERVER['REQUEST_METHOD']);