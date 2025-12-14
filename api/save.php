<?php
// CORS headers for local development
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Data file path
$dataFile = __DIR__ . '/data/toasts.json';
$dataDir = __DIR__ . '/data';

// Ensure data directory exists
if (!is_dir($dataDir)) {
    if (!mkdir($dataDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Could not create data directory']);
        exit();
    }
}

// Get JSON input
$input = file_get_contents('php://input');

if (empty($input)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'No data received']);
    exit();
}

// Parse JSON
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON: ' . json_last_error_msg()]);
    exit();
}

// Validate data structure
if (!isset($data['toasts']) || !is_array($data['toasts'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid data structure: toasts array required']);
    exit();
}

// Validate each toast
foreach ($data['toasts'] as $index => $toast) {
    if (empty($toast['title'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Toast #' . ($index + 1) . ' missing title']);
        exit();
    }
    if (empty($toast['message'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Toast #' . ($index + 1) . ' missing message']);
        exit();
    }
}

// Add/update timestamp
$data['timestamp'] = time() * 1000; // JavaScript-compatible timestamp (milliseconds)

// Save to file
$jsonData = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

if (file_put_contents($dataFile, $jsonData) === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Could not save data to file']);
    exit();
}

// Success response
echo json_encode([
    'success' => true,
    'message' => 'Toasts saved successfully',
    'timestamp' => $data['timestamp'],
    'count' => count($data['toasts'])
]);
