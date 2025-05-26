<?php
require_once 'config.php';

function handleAuth($method) {
    global $pdo;
    
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (isset($data['action'])) {
            switch ($data['action']) {
                case 'register':
                    $stmt = $pdo->prepare("
                        INSERT INTO users (email, full_name)
                        VALUES (:email, :full_name)
                        RETURNING id, email, full_name
                    ");
                    
                    try {
                        $stmt->execute([
                            ':email' => $data['email'],
                            ':full_name' => $data['full_name']
                        ]);
                        
                        echo json_encode([
                            'success' => true,
                            'user' => $stmt->fetch(PDO::FETCH_ASSOC)
                        ]);
                    } catch (PDOException $e) {
                        http_response_code(400);
                        echo json_encode(['error' => 'Email already exists']);
                    }
                    break;
                    
                case 'login':
                    $stmt = $pdo->prepare("
                        SELECT id, email, full_name, wallet_balance_rial, wallet_balance_crypto
                        FROM users
                        WHERE email = :email
                    ");
                    
                    $stmt->execute([':email' => $data['email']]);
                    $user = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    if ($user) {
                        echo json_encode([
                            'success' => true,
                            'user' => $user
                        ]);
                    } else {
                        http_response_code(401);
                        echo json_encode(['error' => 'Invalid credentials']);
                    }
                    break;
            }
        }
    }
}

handleAuth($_SERVER['REQUEST_METHOD']);