<?php
require_once 'config.php';

function handleWallet($method) {
    global $pdo;
    
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (isset($data['action']) && $data['action'] === 'topup') {
            $stmt = $pdo->prepare("
                UPDATE users
                SET wallet_balance_rial = wallet_balance_rial + :amount
                WHERE id = :user_id
                RETURNING wallet_balance_rial
            ");
            
            try {
                $stmt->execute([
                    ':amount' => $data['amount'],
                    ':user_id' => $data['user_id']
                ]);
                
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                echo json_encode([
                    'success' => true,
                    'new_balance' => $result['wallet_balance_rial']
                ]);
            } catch (PDOException $e) {
                http_response_code(400);
                echo json_encode(['error' => 'Failed to update wallet']);
            }
        }
    }
}

handleWallet($_SERVER['REQUEST_METHOD']);